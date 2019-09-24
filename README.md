# Graphsplaining

Graphsplaining is a full-stack performance monitoring and tuning tool for Neo4j. It comes with its own graph for saving insights about querys, so that it does not clutter whatever graph you point it at, and will pull in data from the debug log and, if available, the query log (enterprise only). It automatically runs EXPLAIN against queries found in the logs, and saves the result to its own graph for further analysis.

See Neo4j documentation: (Query Tuning)[https://neo4j.com/docs/cypher-manual/current/query-tuning/] and (Execution Plans)[https://neo4j.com/docs/cypher-manual/current/execution-plans/]

## Getting Started
Currently uses Docker (and docker-compose) to manage the service and it's graph.
For Mac and Windows, install Docker Desktop. 
For Linux, install Docker and docker-compose.

For all: Navigate to the repository's directory and run `docker-compose up -d` to start the service in daemon mode, or `docker-compose up` to start it in foreground.

Because of the depends_on in the docker-compose file, you can do `docker-compose up graphsplaining_service debug_scraper` and it will also bring up the neo4j containers, if you do not want to have the neo4j logs produced in your console but do want the logs from the other containers.

## Configuration
Neo4j configuration options can be set either by providing a config file to the docker container or by setting environment variables on the container in the format: "NEO4J_{config}" where config is the property with periods replaced with underscores, and underscores replaced with two underscores. Such as: `NEO4J_dbms_connector_bolt_listen__address=:17687` to set `dbms.connector.bolt.listen_address`

To explain against a local graph, if using docker on Windows or Mac, set `NEO4J_MAIN_BOLT=bolt://host.docker.internal:7687` in docker-compose.yml. _____ <-- also update the log volume to point to local log directory

## Dev work
The docker-compose file includes a container for running the watch on the GraphsplainingService, use docker-compose logs -f graphsplaining_service_test to keep an eye on tests while working, if using the daemon mode (otherwise the logs will be visible in the midst of all the other logs in console in which you ran docker-compose up). On startup, the test container will run eslint against the folder, if there are linting errors it will not move on to the next test (useful for catching typos). If getting a linter error for a rule that should not apply, submit a pull request with the rule set to "off" in .eslintrc.json
