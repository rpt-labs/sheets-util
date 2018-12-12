# sheets utility

This tool allows rpt-labs services to read/write data to certain specified google sheets.

# Prerequisites
You'll need to set up a few things in order to develop further:

* Two config files at the root of the project - please see lead TM for file contents

* Run npm install to generate your node_modules folder

* In order to interact with the deployed lambda function, you will need an API key and an additional environment variable.  Please see Lead TM for these resources.

# Development Guidelines

* In order to edit the deployed lambda function, you will need to make your changes locally, then compress all files (including config files and node modules folder).  You will upload the resulting Archive.zip to lambda and save.

* Note that every time you make a change to your code that you wish to preserve or upload to AWS lambda, you must delete the old Archive.zip file and create a new one to upload.

* Please be sure to keep current deployed lambda code in sync with this repository as you will be unable to view the code directly from AWS lambda.
