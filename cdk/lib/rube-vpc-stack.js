const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');

class RubeVpcStack extends cdk.Stack {
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
    this.vpc = null;

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

    this.vpc = vpc;
  }
  
  getVPC() {
      return this.vpc;
  }  
}

module.exports = { RubeVpcStack }
