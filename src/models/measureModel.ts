import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RowDataPacket } from 'mysql2';

import { getGeminiResult } from '../gemini/api.js';
import { connectionPool } from '../database/database.js';
import { getMimeTypeFromBase64 } from '../utils/validate.js';

export interface Measure {
    measure_uuid: string;
    customer_code: string;
    measure_datetime: Date;
    measure_type: 'WATER' | 'GAS';
    has_confirmed: string;
    image_url: string;
    measure_value: number;
}

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

// Define a temporary directory path
const images = path.join(__dirname, '../../', 'images');
// Ensure the temp directory exists
if (!fs.existsSync(images)) {
    fs.mkdirSync(images);
}

export const addMeasure = async (measure: Omit<Measure, 'measure_uuid' | 'has_confirmed' | 'image_url'>, image: string): Promise<Measure | string> => {
    // Extract the year and month from the provided measure date
    const newMeasureDate = new Date(measure.measure_datetime);
    const newYear = newMeasureDate.getFullYear();
    const newMonth = newMeasureDate.getMonth(); // Note: 0 is January, 11 is December

    // Check if a measure already exists for the same customer, type, and month
    const connection = await connectionPool.getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM measures WHERE customer_code = ? AND measure_type = ? AND measure_datetime = ?', [measure.customer_code, measure.measure_type, newMeasureDate]);

    if(rows.length > 0) {
        connection.release();
        // Return an error message if a reading already exists
        return `A measure already exists for customer code ${measure.customer_code} in ${newYear}-${newMonth + 1} for ${measure.measure_type}.`;
    }
    else {
        const measure_uuid = uuidv4();

        // Decode base64 image and write to file
        const buffer = Buffer.from(image, 'base64');

        // Find out mime type
        const mime = getMimeTypeFromBase64(image);

        // From mime find out extention, if undefined make it jpeg
        const extention = mime.split('/') || 'jpeg';

        // Save mime type as the extention of file
        const filename = `${measure_uuid}_${Date.now()}.${extention[1]}`;

        // Save the base64 image to a temporary file
        const filepath = path.join(images, filename);
        await fs.promises.writeFile(filepath, buffer);

        // Create a temporary URL for the image
        const image_url = `/images/${filename}`;

        const measureValueFromGemini = await getGeminiResult(filename, mime);
        measure.measure_value = measureValueFromGemini;

        // Create a new measure
        const newMeasure: Measure = {
            ...measure,
            measure_uuid,
            has_confirmed: 'false',
            image_url
        };

        await connection.execute('INSERT INTO measures (measure_uuid, customer_code, measure_datetime, measure_type, has_confirmed, image_url, measure_value) VALUES (?, ?, ?, ?, ?, ?, ?)', [measure_uuid, newMeasure.customer_code, newMeasure.measure_datetime, newMeasure.measure_type, newMeasure.has_confirmed, image_url, newMeasure.measure_value]);
        connection.release();

        return newMeasure;
    }
};

export const findMeasureByUuid = async (measure_uuid: string): Promise<Measure | undefined> => {
    const connection = await connectionPool.getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM measures WHERE measure_uuid = ?', [measure_uuid]);
    connection.release();

    const row = rows[0] as any; // Cast to any or a more specific type if known

    if(!row) {
        return undefined;
    }

    // Access row data
    const measure: Measure = {
        measure_uuid: row.measure_uuid,
        customer_code: row.customer_code,
        measure_datetime: row.measure_datetime,
        measure_type: row.measure_type,
        has_confirmed: row.has_confirmed,
        image_url: row.image_url,
        measure_value: row.measure_value
    };
    
    return measure;  
};

export const findMeasuresByCustomerCode = async (customer_code: string, measure_type?: 'WATER' | 'GAS'): Promise<Measure[]> => {
    const connection = await connectionPool.getConnection();

    // Make measure_type null if there is no measure_type or it will give error because bind parameters can't be undefined
    const measureTypeValue = measure_type ?? null;

    const [rows] = await connection.execute('SELECT * FROM measures WHERE customer_code = ? AND (? IS NULL OR measure_type = ?)', [customer_code, measureTypeValue, measureTypeValue]);
    connection.release();

    return rows as Measure[];
};

export const confirmMeasure = async (measure_uuid: string, confirmed_value: number): Promise<Measure | { error_code: string; error_description: string }> => {
    const measure = await findMeasureByUuid(measure_uuid);

    /*
        Below, instead of default "Leitura do mês já realizada", messages,I took liberty to improve it in sake of a clearer error message.
        It can be changed to default message by simply changing the string in error_description 's key
    */

    if(!measure) {
        return {
            error_code: 'MEASURE_NOT_FOUND',
            error_description: `Measure with UUID ${measure_uuid} was not found.`
        };
    }
    else if(measure?.has_confirmed === 'true') {
        return {
            error_code: 'CONFIRMATION_DUPLICATE',
            error_description: `Measure with UUID ${measure_uuid} for customer ${measure.customer_code} was already confirmed on ${measure.measure_datetime.toISOString()} with value of ${measure.measure_value}.`
        };
    }
    else{
        measure.has_confirmed = 'true';
        measure.measure_value = confirmed_value;

        const connection = await connectionPool.getConnection();
        await connection.execute('UPDATE measures SET has_confirmed = ?, measure_value = ? WHERE measure_uuid = ?', [measure.has_confirmed, measure.measure_value, measure.measure_uuid]);
        connection.release();

        return measure;
    }
};