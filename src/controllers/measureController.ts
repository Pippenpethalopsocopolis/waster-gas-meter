import { Request, Response } from 'express';

import { addMeasure, confirmMeasure, findMeasuresByCustomerCode } from '../models/measureModel.js';
import { isValidBase64, isValidMeasureType } from '../utils/validate.js';

export const uploadImage = (req: Request, res: Response): Response => {
    const { image, customer_code, measure_datetime, measure_type } = req.body;

    // Validate the image and measure type
    if (!isValidBase64(image) || !isValidMeasureType(measure_type)) {
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description: 'Invalid image data or measure type',
        });
    }
    
    try {
        const newMeasure = addMeasure({
            customer_code,
            measure_datetime: new Date(measure_datetime),
            measure_type: measure_type.toUpperCase() as 'WATER' | 'GAS',
            measure_value: 0, // Placeholder for actual LLM reading
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
    } catch (err) {
        console.error('Error saving the image file:', err);
        return res.status(500).json({
            error_code: 'SERVER_ERROR',
            error_description: 'An error occurred while saving the image file.',
        });
    }
};

export const confirmMeasureValue = (req: Request, res: Response): Response => {
    const { measure_uuid, confirmed_value } = req.body;

    const result = confirmMeasure(measure_uuid, confirmed_value);

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

export const listMeasures = (req: Request, res: Response): Response => {
    const customer_code = req.params.customer_code;
    const measure_type = req.query.measure_type as string;
    
    const measures = findMeasuresByCustomerCode(
        customer_code,
        measure_type ? (measure_type.toUpperCase() as 'WATER' | 'GAS') : undefined
    );

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
        return res.status(200).json({ customer_code, measures });
    }
};