# water-gas-meter
This is an API that reads you water and gas from water/gas meter using Gemini AI. You need Gemini Developer API key to use this.

Docker should handle mysql and node.js setup.

You can change api key and ports from the docker-compose.yml

You can also use .env file for ports and api key.

# Usage
In order to use API, users need to upload an base64 encoded image to the API. You can alter codes if you want users to upload an image directly.

/upload
Request Body 
{
"image": "base64", 
"customer_code": "string", 
"measure_datetime": "datetime", 
"measure_type": "WATER" or "GAS"
}

An sucesfull request will return a response like this,
{ 
“image_url”: string, 
“measure_value”:integer, 
“measure_uuid”: string 
}


There are also paths like /confirm,  /<customer code>/list that developers can use to record the user data.

## Thanks for your time!
