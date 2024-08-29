import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Measure {
    measure_uuid: string;
    customer_code: string;
    measure_datetime: Date;
    measure_type: 'WATER' | 'GAS';
    has_confirmed: boolean;
    image_url: string;
    measure_value: number;
}

const measures: Measure[] = [];

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

// Define a temporary directory path
const images = path.join(__dirname, '../../', 'images');
// Ensure the temp directory exists
if (!fs.existsSync(images)) {
    fs.mkdirSync(images);
}

export const addMeasure = (measure: Omit<Measure, 'measure_uuid' | 'has_confirmed' | 'image_url'>, image: string): Measure | string => {
    // Extract the year and month from the provided measure date
    const newMeasureDate = new Date(measure.measure_datetime);
    const newYear = newMeasureDate.getFullYear();
    const newMonth = newMeasureDate.getMonth(); // Note: 0 is January, 11 is December

    // Check if a measure already exists for the same customer, type, and month
    const existingMeasure = measures.find(m =>
        m.customer_code === measure.customer_code &&
        m.measure_type === measure.measure_type &&
        m.measure_datetime.getFullYear() === newYear &&
        m.measure_datetime.getMonth() === newMonth
    );

    if(existingMeasure) {
        // Return an error message if a reading already exists
        return `A measure already exists for customer code ${measure.customer_code} in ${newYear}-${newMonth + 1} for ${measure.measure_type}.`;
    }
    else{
        // Save the base64 image to a temporary file
        const filename = `${measure.customer_code}_${Date.now()}.png`;
        const filepath = path.join(images, filename);

        // Decode base64 image and write to file
        const buffer = Buffer.from(image, 'base64');
        fs.writeFileSync(filepath, buffer);

        // Create a temporary URL for the image
        const image_url = `/api/measures/images/${filename}`;

        // Create a new measure
        const newMeasure: Measure = {
            ...measure,
            measure_uuid: uuidv4(),
            has_confirmed: false,
            image_url
        };
        measures.push(newMeasure);

        return newMeasure;
    }
};

export const findMeasureByUuid = (measure_uuid: string): Measure | undefined => {
    return measures.find(m => m.measure_uuid === measure_uuid);
};

export const findMeasuresByCustomerCode = (customer_code: string, measure_type?: 'WATER' | 'GAS'): Measure[] => {
    return measures.filter(m => m.customer_code === customer_code && (!measure_type || m.measure_type === measure_type));
};

export const confirmMeasure = (measure_uuid: string, confirmed_value: number): Measure | { error_code: string; error_description: string } => {
    const measure = findMeasureByUuid(measure_uuid);

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
    else if(measure.has_confirmed) {
        return {
            error_code: 'CONFIRMATION_DUPLICATE',
            error_description: `Measure with UUID ${measure_uuid} for customer ${measure.customer_code} was already confirmed on ${measure.measure_datetime.toISOString()} with a value of ${measure.measure_value}.`
        };
    }
    else{
        measure.has_confirmed = true;
        measure.measure_value = confirmed_value;

        return measure;
    }
};