


from flask import Flask, request, jsonify
from geolocation import get_geolocation_info, check_optional_field_entry_is_supported

app = Flask(__name__)


required_request_fields = {"reqId", "ip"}
optional_fields = {"service"}
response_fields = {"reqId","countryCode","lat","lon"}
global_error_message = ""

BAD_REQUEST = 400
PORT_NUM = 8123


def is_good_request_body(request_json):
    """
    Checks if the client's request is valid
    """
    global global_error_message

    # Checks if request body is empty
    if request_json == {}:
        global_error_message = "Empty request body."
        return False

    # Checks if has all required fields
    for field in required_request_fields:
        if field not in request_json:
            global_error_message = "Missing field \"" + str(field) + "\" in request body."
            return False

    # Checks if has unexpected fields
    for field in request_json:
        if field not in required_request_fields and field not in optional_fields:
            global_error_message = "Unexpected field \"" + str(field) + "\" in request body."
            return False

    # Check if optional fields are valid
    for field in optional_fields:
        if not check_optional_field_entry_is_supported(request_json, field):
            global_error_message = "Unsupported service \""+str(request_json[field])+"\" in request body."
            return False

    return True


@app.route("/",methods=["POST"])
def receive_and_respond():
    """
    Receives HTTP POST requests and responds if the payload is as expected. Otherwise responds with errorcode 400
    """
    request_data_json = request.json
    response_data = {}

    # Check validity of request body
    if not is_good_request_body(request_data_json):
        response_data["status"] = BAD_REQUEST
        response_data["message"] = global_error_message
        response_data["query"] = request_data_json
        return jsonify(response_data)

    # Get geo info
    response_data = get_geolocation_info(request_data_json)

    return jsonify(response_data)

if __name__=="__main__":
    app.run(debug=True, port=PORT_NUM)
