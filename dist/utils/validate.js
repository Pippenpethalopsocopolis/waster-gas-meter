export const isValidBase64 = (str) => {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    }
    catch (err) {
        return false;
    }
};
export const isValidMeasureType = (measure_type) => {
    return ['WATER', 'GAS'].includes(measure_type.toUpperCase());
};
export const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};
// Function to find out mime type
export const getMimeTypeFromBase64 = (image) => {
    // Decode the Base64 string
    const buffer = Buffer.from(image, 'base64');
    // Check for PNG signature
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 &&
        buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    // Check for JPEG signature
    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 &&
        buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    return 'image/jpeg'; // Default fallback MIME type
};
