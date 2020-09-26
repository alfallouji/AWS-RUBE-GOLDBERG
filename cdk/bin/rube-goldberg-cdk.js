#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');

const { RubeVpcStack } = require('../lib/rube-vpc-stack');
const { RubeEc2Stack } = require('../lib/rube-ec2-stack');
const { RubeCommonStack } = require('../lib/rube-common-stack');
const { RubeS3Stack } = require('../lib/rube-s3-stack');
const { RubeAllStack } = require('../lib/rube-all-stack');

const app = new cdk.App();

var props = {};
const env_name = app.node.tryGetContext('env');
switch(env_name) { 
    case 'prod':
        props = require('../conf/config.prod.json');
    break;
    
    case 'dev':
        props = require('../conf/config.dev.json');
    break;
    
    default:
        throw('An environment context must be provided (-c env=prod|dev)');
    break;
}

// If provided in th command line, override region paramater
const region = app.node.tryGetContext('region');
if (region) {
    props.env.region = region;    
    console.log("Overriding region value: " + props.env.region);
} else {
    console.log("Using region value from config file: " + props.env.region);
}

// Inject AWS SDK into properties
props.AWS = require('aws-sdk');
props.AWS.config.update({region: props.env.region});

var prefix = env_name.charAt(0).toLowerCase() + env_name.slice(1);

props.stackName = 'rube-' + prefix + '-vpc';
var vpcStack = new RubeVpcStack(app, props.stackName, props);
if (vpcStack) {
    props.vpc.current = vpcStack.getVPC();
} else { 
    props.vpc.lookupName = props.stackName + '/' + props.vpc.name;
    props.vpc.current = ec2.Vpc.fromLookup(this, props.vpc.name, {
        isDefault: false,
        vpcName: props.vpc.lookupName,
    });    
}

props.stackName = 'rube-' + prefix + '-common';
var commonStack = new RubeCommonStack(app, props.stackName, props);

props.stackName = 'rube-' + prefix + '-ec2';
var ec2Stack = new RubeEc2Stack(app, props.stackName, props);

props.stackName = 'rube-' + prefix + '-s3';
var s3Stack = new RubeS3Stack(app, props.stackName, props);

props.stackName = 'rube-' + prefix + '-all';
var allStack = new RubeAllStack(app, props.stackName, props);
