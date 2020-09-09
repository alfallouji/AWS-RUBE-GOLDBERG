const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');
const iam = require('@aws-cdk/aws-iam');
const autoscaling = require('@aws-cdk/aws-autoscaling');
const elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
const utils = require('../utils/lookup.js');

class RubeEc2Stack extends cdk.Stack {
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
    var vpc = props.vpc.current;
    
    // Load/Fetch the existing app security group 
    var lookup = new utils.Lookup(props);
    var clientSecurityGroup = await lookup.getAppSecurityGroup(this);
  
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
  }
}

module.exports = { RubeEc2Stack }
