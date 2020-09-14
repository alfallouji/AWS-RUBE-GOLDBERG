# AWS-RUBE-GOLDBERG

<h1>Initial Rube Goldberg Machine (RGM) in AWS</h1>
<h2>From one bucket to another</h2>
<p class="lead">You will start with a simple RGM. You can send a message via this webapp that will get automatically replicated from one S3 bucket to another. The message is kept as-is and the replication happens within 15 minutes (usually much faster).</p>
<img src="https://github.com/alfallouji/AWS-RUBE-GOLDBERG/raw/master/webapp/img/1.png" />

<p class="lead">This same webapp can be used to check if the message has been successfully delivered into the output/destination bucket.</p>
<img src="https://github.com/alfallouji/AWS-RUBE-GOLDBERG/raw/master/webapp/img/2.png" />

<h1>Create your own Rube Goldberg Machine in AWS</h1>
<p class="lead">Your first step is to deactivate the S3 replication and replace it with your own Rube Goldberg Machine. You have to make sure that the message in the input bucket ultimately gets delivered in the output bucket. Make sure to read the rules of engagement below.</p>
<img src="https://github.com/alfallouji/AWS-RUBE-GOLDBERG/raw/master/webapp/img/3.png" />

<h1>Rules of engagement</h1>
<div class="panel panel-primary">
  <!-- Default panel contents -->
  <div class="panel-heading">If you want to win this contest, it is important to respect the following rules.</div>

  <!-- List group -->
  <ol class="list-group">
    <li class="list-group-item">Do not delete or modify the configuration of the input, output buckets and this EC2 instance.</li>
    <li class="list-group-item">Each AWS service used will give your team 10 points. Using the exact same service several times will not give you any additional points (with the exception of the services used by the initial setup).</li>
    <li class="list-group-item">Each AWS service used must serve a purpose. It must receive an input from the machine and provide an output to the next component(s).</li>
    <li class="list-group-item">There is a maximum execution time of 15 minutes for your Rube Goldberg Machine. You will loose all points if it takes more time for your message to show up in the output bucket.</li>
    <li class="list-group-item">The uniqid and the timestamp generated in the initial message cannot be altered and must show up in the output. You will loose all points if that rule is broken.</li>
    <li class="list-group-item">You should present your demo in the following order : First, start by generating a new message via this webapp. Then, show us an overview of the architecture of your Rube Goldberg machine and finally show us the output (using this webapp).</li>
    <li class="list-group-item">The following services are not available to be used: route53, etc. </li>
    <li class="list-group-item">The key to victory is to think out of the box. Surprise (positively) the jury and you may have a chance to earn some bonus points.</li>
    <li class="list-group-item">Every team starts with 0 point. Again, the services used by the initial RBM do not count (e.g. S3, EC2 instance). Therefore, you will get points if you use those in your RBM.</li>
    <li class="list-group-item">You can use the console to provision and configure the new resources. If you automate the creation and configuration of a specific service via a script (e.g. cloudformation), you will double your points for that specific service.</li>
    <li class="list-group-item">If you have a question or are stuck, don't hesitate to ask for some help from an AWS specialist.</li>
  </ol>
</div>    

### todo's
 - Lock S3 buckets output permissions
 - Lock EC2 instance (ssh access)
 - Think of a way to automatically count points
 - Etc.
 
