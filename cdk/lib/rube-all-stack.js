const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');
const s3 = require('@aws-cdk/aws-s3');
const iam = require('@aws-cdk/aws-iam');
const utils = require('../utils/lookup.js');

class RubeAllStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    this.executeStack(scope, id, props);
  }
  
  /**
   * Async function containing all the logic
   * 
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  async executeStack(scope, id, props) {    
    // Create a VPC
    const vpc = new ec2.Vpc(this, "vpc", {
        maxAzs: props.vpc.maxAzs,
        subnetConfiguration: [
            {
                cidrMask: 24,
                name: 'public',
                subnetType: ec2.SubnetType.PUBLIC,
            }
        ]
    });
    
    // Security group for the guestbook app
    let clientSecurityGroup = new ec2.SecurityGroup(this, props.instance.securityGroupName, {
      vpc: vpc,
      description: "Security Group App",
    });
    
    // Tag the security group so it can be looked up easily
    cdk.Tag.add(clientSecurityGroup, 'cdk-name-lookup', props.instance.securityGroupName);    
    
    const trustedRemoteNetwork = ec2.Peer.anyIpv4();
    const httpPort = ec2.Port.tcp(80);
    clientSecurityGroup.addIngressRule(
      trustedRemoteNetwork,
      httpPort,
      'Allow inbound HTTP port 80 from anywhere'
    );

    // Create role for the EC2 instance
    const role = new iam.Role(this, props.instance.rolename, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });
    
    // allow instance to communicate with secrets manager & ssm (for debug purposes if needed)
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(props.instance.roleManagedPolicyName1));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(props.instance.roleManagedPolicyName2));    
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(props.instance.roleManagedPolicyName3));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(props.iam.ssmManagedPolicyName));
    
    // User data that will deploy the application on the instance
    var userdata = ec2.UserData.forLinux();
    userdata.addCommands(
      'sudo curl https://raw.githubusercontent.com/alfallouji/AWS-RUBE-GOLDBERG/master/webapp/setup/userdata.sh > /tmp/userdata.sh', 
      'sudo sh /tmp/userdata.sh'
    );
    
    // Use latest amazon linux2 AMI
    var machineImage = new ec2.AmazonLinuxImage({generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2});
    
    // Make sure to place that instance in a public subnet
    var subnets = vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC});

    var ec2Instance = new ec2.Instance(this, 'Instance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      vpc: vpc,
      instanceName: props.instance.name + '-' + props.environmentType,
      vpcSubnets: subnets,
      machineImage: machineImage,
      role: role,
      securityGroup: clientSecurityGroup,
      userData: userdata
    });

    // Create an EIP for the instance
    const ec2EIP = new ec2.CfnEIP(ec2Instance, 'guestbook-eip', {
      domain: 'vpc',
      instanceId: ec2Instance.instanceId,
    });
    
    // Output load balancer dns 
    /**
    new cdk.CfnOutput(this, 'EIP', {
      exportName: 'EIP',
      value: ec2EIP.ip,
      description: 'EIP for the webapp'
    });    
    */
  }
}

module.exports = { RubeAllStack }
