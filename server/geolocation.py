

from requests import get
from random import choice

supported_geo_services = ["IP API","IP Info","random"]
supported_optional_fields_values = {"service":supported_geo_services}
IP_API_URL = "http://ip-api.com/json/"
IP_INFO_URL = "https://ipinfo.io/"
OK = 200
URL_FUNC = 0
RESPONSE_PARSER_FUNC = 1


"""
    The following code gets the geolocation info for the client. If you want to add a service, you must 
       do the following:
       1) Add the supported service to the supported_geo_services list variable above
       2) Supply a function that constructs the url to access the service, the function name should be
          in the following format "make_<service>_url"
       3) Supply a function that parses the API response of the service, the function name should be
          in the following format "parse_<service>_response"
       4) Add the service to the service_funcs_dict, the key is the name and the value is a tuple
          of the two functions you supplied in steps 2 and 3, like so: (url_func, parser_func)
"""



"""
    Service Specific Functions
"""

def make_ip_api_url(ip):
    """
    Makes the url to query for the IP API service
    """
    url = IP_API_URL + ip
    return url

def make_ip_info_url(ip):
    """
    Makes the url to query for the IP Info service
    """
    url = IP_INFO_URL + ip + "/?token=f290a0552c73c7"
    return url

def parse_ip_api_response(response_json):
    """
    Parser for the IP API's response.
    """
    parsed_json = {}
    if response_json["status"] == "success":
        parsed_json["countryCode"] = response_json["countryCode"]
        parsed_json["lat"] = response_json["lat"]
        parsed_json["lon"] = response_json["lon"]
        return parsed_json

    return response_json

def parse_ip_info_response(response_json):
    """
    Parser for the IP Info's response.
    """
    parsed_json = {}
    if "status" not in response_json: # This means that the request was successful
        location_coordinates = response_json["loc"].split(",")
        parsed_json["lat"] = float(location_coordinates[0])
        parsed_json["lon"] = float(location_coordinates[1])
        parsed_json["countryCode"] = response_json["country"]
        return parsed_json

    return response_json




"""
   The Processing of the Geolocation Information
"""

# Maps the service to its functions that are used for it
service_funcs_dict = {"IP API": (make_ip_api_url,parse_ip_api_response), "IP Info": (make_ip_info_url,parse_ip_info_response)}


def get_geo_response(user_request_body, service):
    """
    Finds the url for the given service, then gets the response and converts it to json format.
    """
    url = service_funcs_dict[service][URL_FUNC](user_request_body["ip"]) # Call the url function of the service
    response = get(url)
    return response.json()


def format_geo_response(user_request_body, geo_service_response, service):
    """
    Formats the response from the geolocation service we used. We
    :param user_request_body: original request body of the client
    :param geo_service_response: the geolocation service's response
    :param service: which geolocation service we used to get a response
    """
    formatted_response_dict = service_funcs_dict[service][RESPONSE_PARSER_FUNC](geo_service_response) # Call the parser function of the service
    formatted_response_dict["reqId"] = user_request_body["reqId"] # Add the request ID supplied by the client
    return formatted_response_dict

def get_geolocation_info(user_request_body):
    """
    The primary function that creates the geolocation response for the client.
    Queries the geolocation website's API to craft a response json. The default website it queries is IP API, but if
    the "service" field is present in the user_request_body, then it uses that website
    """
    service = user_request_body["service"] if "service" in user_request_body else "IP API"

    if service == "random" or service not in supported_geo_services:
        service = choice(supported_geo_services)

    geo_response_json = get_geo_response(user_request_body, service)

    return format_geo_response(user_request_body, geo_response_json, service)


def check_optional_field_entry_is_supported(response_json, field):
    """
    Utility function that checks that for each optional field provided in the request, that its value is valid
    """
    if field in response_json:
        if response_json[field] not in supported_optional_fields_values[field]:
            return False
    return True


