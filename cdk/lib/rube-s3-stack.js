const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');

class RubeS3Stack extends cdk.Stack {
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
  
    new s3.Bucket(this, props.s3.inputBucket, {
      versioned: false,
      bucketName: props.s3.inputBucket,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    
    new s3.Bucket(this, props.s3.outputBucket, {
      versioned: false,
      bucketName: props.s3.outputBucket,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}

module.exports = { RubeS3Stack }
