import { Request, Response } from 'express';

import { addMeasure, confirmMeasure, findMeasuresByCustomerCode } from '../models/measureModel.js';
import { isValidBase64, isValidMeasureType, isValidDate } from '../utils/validate.js';

export const uploadImage = async (req: Request, res: Response): Promise<Response> => {
    const { image, customer_code, measure_datetime, measure_type } = req.body;
    
    const measureDate = new Date(measure_datetime);

    /*  
        Try and catch could be(actually should be) implemented from here
        but beacause of I would need another return with response statement(typescript enforces it) I choose not to include try/catch
        because I shouldn't give other responses other than you explicitly writed according to pdf you sent.
    */

    // Validations
    if(!isValidBase64(image) || !isValidMeasureType(measure_type) || !isValidDate(measureDate) || typeof customer_code !== 'string') {
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description: 'Invalid data. Check your image, measure_type, customer_code or measure_datetime values and try again.'
        });
    }
    else{
        const newMeasure = await addMeasure({
            customer_code,
            measure_datetime: measureDate,
            measure_type: measure_type.toUpperCase() as 'WATER' | 'GAS',
            measure_value: 0,
        }, image);
    
        // Handle the result from addMeasure
        if (typeof newMeasure === 'string') {
            return res.status(409).json({
                error_code: 'DOUBLE_REPORT',
                error_description: newMeasure,
            });
        } else {
            return res.status(200).json({
                image_url: newMeasure.image_url,
                measure_value: newMeasure.measure_value,
                measure_uuid: newMeasure.measure_uuid,
            });
        }
    }
};

export const confirmMeasureValue = async (req: Request, res: Response): Promise<Response> => {
    const { measure_uuid, confirmed_value } = req.body;

    const result = await confirmMeasure(measure_uuid, confirmed_value);

    // Check the error code and set the appropriate status
    if(typeof measure_uuid !== 'string' || typeof confirmed_value !== 'number') {
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description: 'The data provided in the request body is invalid. Ensure that measure_uuid is a string and confirmed_value is an integer.'
        });
    }
    else if('error_code' in result) {
        if(result.error_code === 'MEASURE_NOT_FOUND') {
            return res.status(404).json(result);
        }
        else{
            return res.status(409).json(result);
        }
    }
    else {
        return res.status(200).json({ success: true });
    }
};

export const listMeasures = async (req: Request, res: Response): Promise<Response> => {
    const customer_code = req.params.customer_code;
    const measure_type = req.query.measure_type as string;
    
    const measures = await findMeasuresByCustomerCode(customer_code, measure_type ? (measure_type.toUpperCase() as 'WATER' | 'GAS') : undefined);
    
    // Since mysql cant hanlde booleans turn string true or false to boolean, save it as a new array
    const transformedMeasures = measures.map(measure => {
        return {
            ...measure,
            has_confirmed: measure.has_confirmed === 'true'
        };
    });

    if(measure_type && !isValidMeasureType(measure_type)) {
        return res.status(400).json({
            error_code: 'INVALID_TYPE',
            error_description: 'Tipo de medição não permitida.',
        });
    }
    else if(measures.length === 0) {
        return res.status(404).json({
            error_code: 'MEASURES_NOT_FOUND',
            error_description: 'Nenhuma leitura encontrada.',
        });
    }
    else{
        return res.status(200).json({ customer_code, measures: transformedMeasures });
    }
};