
const lodash = require('lodash');


/** Testing Utils */
const GOOD_REQUEST = 0, BAD_REQUEST = 1
const DEV_SERVER_URL = "http://127.0.0.1:8123"

const check_response = (response,expected_fields) => {
    /** This function checks that correctly made requests receive the correct response from the server */

    for(const [field, value] of expected_fields){
        if (!(field in response)){
            throw new Error(`Missing the following field: ${field}`)
        }
        if(response[field] !== value){
            throw new Error(`Unexpected field value. \nExpected: ${field} : ${value}.
            \nGot: ${field} : ${response[field]}`)
        }
    }
}

const check_error_response = (actual_error, expected_error) => {
    if (lodash.isEqual(actual_error,expected_error)){
        console.log(`Correct Error: ${JSON.stringify(actual_error).replace(/\\/g, '')}`);
    } else {
        throw new Error(`Wrong Error Response! Expected: ${JSON.stringify(expected_error).replace(/\\/g, '')}, Got: ${JSON.stringify(actual_error).replace(/\\/g, '')}`)
    }
}

const make_request_and_test_response = (url, payload, expected_fields, expected_error, request_type) => {
    fetch(url, {
        method:"POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body:payload})
    .then(response=> {
            if (response.ok) {
                return response.json()
            }
            throw new Error("Request failed with status code: " + response.status)
        })
    .then(response_json=>{
        if (request_type === GOOD_REQUEST) {
            if (!payload.includes("\"service\":\"random\"")){
                check_response(response_json, expected_fields)
            } else {
                console.log("Random Service Selected")
            }
        } else if (request_type === BAD_REQUEST) {
            check_error_response(response_json, expected_error)
        } else {
            throw new Error("Incorrect request_type, must be either 0 (good request) or 1 (bad request)")
        }
        console.log("Test Passed")
    })
    .catch(error=>console.log(error))
}

const test_good_request = (request_id, ip_address, _service = "IP API", expected_fields = {}) => {

    let json_payload = {
        reqId: request_id,
        ip: ip_address
    }
    if (_service !== "IP API"){
        json_payload.service = _service
    }
    make_request_and_test_response(DEV_SERVER_URL,JSON.stringify(json_payload),expected_fields,{},GOOD_REQUEST)
}


const Test_Map_IP_API = new Map([
        ["reqId", 1],
        ["lat", 39.03],
        ["lon", -77.5],
        ["countryCode", "US"]
    ])

const Test_Map_IP_Info = new Map([
        ["reqId", 2],
        ["lat", 37.4056],
        ["lon", -122.0775],
        ["countryCode", "US"]
    ])



/** Tests */

const test_unsupported_service = () => {
    let json_payload = {
        reqId: 1,
        ip: "8.8.8.8",
        service: "Cracker IP"
    }

    let expected_error = {
        message: `Unsupported service \"${json_payload.service}\" in request body.`,
        query : json_payload,
        status: 400
    }
    make_request_and_test_response(DEV_SERVER_URL,JSON.stringify(json_payload), Test_Map_IP_API,expected_error, BAD_REQUEST)
}
const missing_field_test = (missing_field)=> {
    let json_payload = {
        reqId: 1,
        ip: "8.8.8.8"
    }
    delete json_payload[missing_field]

    let expected_error = {
        message: `Missing field \"${missing_field}\" in request body.`,
        query : json_payload,
        status: 400
    }
    make_request_and_test_response(DEV_SERVER_URL,JSON.stringify(json_payload), Test_Map_IP_API,expected_error, BAD_REQUEST)
}

const empty_payload_test = ()=> {
    let expected_error = {
        message: "Empty request body.",
        query : {},
        status: 400
    }
    make_request_and_test_response(DEV_SERVER_URL,JSON.stringify({}), Test_Map_IP_API,expected_error,BAD_REQUEST)
}

const unexpected_field_in_payload_test = () => {
    let json_payload = {
        reqId: 1,
        ip: "8.8.8.8",
        monkey: "spidermonkey"
    }
    let expected_error = {
        message: "Unexpected field \"monkey\" in request body.",
        query : json_payload,
        status: 400
    }
    make_request_and_test_response(DEV_SERVER_URL,JSON.stringify(json_payload), Test_Map_IP_API,expected_error,BAD_REQUEST)
}

const test_bad_ip_IP_API = () => {
    let json_payload = {
        reqId: 5,
        ip: "Jake"
    }
    let expected_error = {
      "query": "Jake",
      "message": "invalid query",
      "status": "fail",
      "reqId":5
    }
    make_request_and_test_response(DEV_SERVER_URL, JSON.stringify(json_payload), {}, expected_error, BAD_REQUEST)
}

const test_bad_ip_IP_INFO = () => {
    let json_payload = {
        reqId: 5,
        ip: "Jake",
        service: "IP Info"
    }
    let expected_error = {
        "error":{
            "message":"Please provide a valid IP address",
            "title":"Wrong ip"
        },
        "reqId":5,
        "status":404
    }
    make_request_and_test_response(DEV_SERVER_URL, JSON.stringify(json_payload), {}, expected_error, BAD_REQUEST)
}


// 1) Test with correct payload, no service provided (Should default to IP API)
test_good_request(1,"8.8.8.8", "IP API", Test_Map_IP_API)

// 2) Test with correct payload, service provided (IP Info)
test_good_request(2,"8.8.8.8", "IP Info", Test_Map_IP_Info)

//  3) Unsupported Service
test_unsupported_service()

//  4) Missing fields in payload
missing_field_test("reqId")
missing_field_test("ip")

//   5) Empty Payload
empty_payload_test()

//    6) Unexpected field in payload
unexpected_field_in_payload_test()

//    7) Bad IP Address IP API
test_bad_ip_IP_API()

//    8) Bad IP Address IP Info
test_bad_ip_IP_INFO()

