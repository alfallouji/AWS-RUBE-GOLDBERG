<?php
date_default_timezone_set('Europe/London');
require dirname(__FILE__) . '/../vendor/autoload.php';

// Setup app 
$az = file_get_contents('http://169.254.169.254/latest/meta-data/placement/availability-zone');
$region = substr($az, 0, -1);

// Generate uniqid id for the buckets
$bucketInput = 'rube-goldberg-input-' . uniqid();
$bucketOutput = 'rube-goldberg-output-' . uniqid();

$cfnFilename = 'rube-dev-s3.template.json';
$cfn = file_get_contents(dirname(__FILE__) . '/' . $cfnFilename);
$stack = array(
    'StackName' => 'rube-goldberg-stack-' . uniqid(),
    'TemplateBody' => $cfn,
    'Parameters' => array(
        array(
            'ParameterKey' => 'sourceBucketName',
            'ParameterValue' => $bucketInput,
        ),
        array(
            'ParameterKey' => 'destinationBucketName',
            'ParameterValue' => $bucketOutput,
        ),        
    ),
    'Capabilities' => array('CAPABILITY_IAM'),
);

$client = new \Aws\CloudFormation\CloudFormationClient([
    'version' => 'latest',
    'region'  => $region
]);

$result = $client->createStack($stack);

// Generate config file
$configParams = array(
    'region' => $region,
    'bucket-input' => $bucketInput,
    'bucket-output' => $bucketOutput
);

$configContent = '<?php return ' . var_export($configParams, true) . ';';
file_put_contents(dirname(__FILE__) . '/config.php', $configContent);