The following program creates a server that receives geolocation requests and forwards them to 
different established geolocation services and sends back their responses to the user. 

The response is either a good response with information, or a response with error info in the event of a 
bad request or a geolocation server failure.

A good response consists of the country code, and approx latitude and longitude of 
the given IP address based on the service inserted into the request. If not service
is provided, then defaults to the IP API geolocation service. Setting the service field to 
random chooses a random supported service.

The javascript code included in the testing_requests.js file are some tests for the program, checking that good requests return good responses and that bad requests return error responses with an informative message. 
