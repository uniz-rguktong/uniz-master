#!/bin/bash
# ==============================================================================
# UNIZ INFRASTRUCTURE - DATABASE INITIALIZATION ENGINE
# ==============================================================================
# Author: UNIZ Engineering
# Description: Automatically bootstraps microservice-specific databases 
#              from a comma-separated list of names provided via env.
# ==============================================================================

set -e
set -u

function create_user_and_database() {
	local database=$1
	echo "  Creating database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE DATABASE $database;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		create_user_and_database $db
	done
	echo "Multiple databases created"
fi
