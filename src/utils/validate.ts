export const isValidBase64 = (str: string): boolean => {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
        return false;
    }
};

export const isValidMeasureType = (measure_type: string): boolean => {
    return ['WATER', 'GAS'].includes(measure_type.toUpperCase());
};

export const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
};