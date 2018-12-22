#!/usr/bin/env bash 

tar -zcvf api.tar.gz --exclude=.git --exclude=.gradle --exclude=api.tar.gz .
