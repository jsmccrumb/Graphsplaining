# Graphsplaining

## Getting Started
Currently uses Docker (and docker-compose) to manage the service and it's graph.
For Mac and Windows, install Docker Desktop. 
For Linux, install Docker and docker-compose.

For all: Navigate to the repository's directory and run `docker-compose up -d` to start the service in daemon mode, or `docker-compose up` to start it in foreground.

## Configuration
Neo4j configuration options can be set either by providing a config file to the docker container or by setting environment variables on the container in the format: "NEO4J_{config}" where config is the property with periods replaced with underscores, and underscores replaced with two underscores. Such as: `NEO4J_dbms_connector_bolt_listen__address=:17687` to set `dbms.connector.bolt.listen_address`
