<?php
DEFINE('MSG_FILENAME', sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'messages.php');
if (file_exists(MSG_FILENAME)) {
     $messages = include(MSG_FILENAME);
} else {
     $messages = array();
}
?>
<html>
    <head>
        <style>
            body { padding-top: 50px; }
            .starter-template {
              padding: 40px 15px;

            }
            img { margin-bottom:50px; margin-top: 5px; }
            .list-group-item {
                display: list-item !important;
            }
            @import url("https://fonts.googleapis.com/css?family=Lato:400,400i,700");
            ol {

              counter-reset: my-awesome-counter;
              list-style: none;
              padding-left: 40px;
            }
            ol li {
              margin: 0 0 0.5rem 0;
              counter-increment: my-awesome-counter;
              position: relative;
            }
            ol li::before {
              content: counter(my-awesome-counter);
              color: #fcd000;
              font-size: 1.5rem;
              font-weight: bold;
              position: absolute;
              --size: 32px;
              left: calc(-1 * var(--size) - 10px);
              line-height: var(--size);
              width: var(--size);
              height: var(--size);
              top: 0;
              transform: rotate(-10deg);
              background: black;
              border-radius: 50%;
              text-align: center;
              box-shadow: 1px 1px 0 #999;
            }
        </style>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" integrity="sha384-HSMxcRTRxnN+Bdg0JdbxYKrThecOKuH5zCYotlSAcp1+c8xmyTe9GYg1l9a69psu" crossorigin="anonymous">
        <title>Rube Goldberg Challenge</title>
    </head>
    <body>
        <nav class="navbar navbar-inverse navbar-fixed-top">
           <div class="container">
                <div class="navbar-header">
                  <a class="navbar-brand" href="?action=instructions">Rube Goldberg Challenge</a>
                </div>

             <div id="navbar" class="collapse navbar-collapse">
               <ul class="nav navbar-nav">
                  <?php
                    $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '?';

                    $menus = array(
                        'instructions' => 'instructions',
                        'Send / Check a message' => '?',
                        's3 replication' => 'replication',
                    );
                    foreach ($menus as $menu => $link) {
                        $class = '';
                        if ($action == $link) {
                            $class = ' class="active"';
                        }
                        if ($link != '?') {
                            $link = '?action=' . $link;
                        }
                        echo '<li' . $class . '><a href="' . $link . '">' . ucfirst($menu) . '</a></li>';
                    }
                ?>
               </ul>
             </div>
           </div>
         </nav>

        <div class="container">
           <div class="starter-template">
            <div id="content">
                <div id="inner">
                    <?php
                    require 'vendor/autoload.php';
                    $config = require('conf/config.php');
                    use Aws\S3\S3Client;
                    $s3 = new S3Client([
                        'version' => 'latest',
                        'region'  => $config['region']
                    ]);

                    switch ($action) {
                        case 'send':
                            $id = md5(uniqid());
                            $bucketName = $config['bucket-input'];
                            $objectName = 'message-' . $id;
                            $message = json_encode(array('id' => $id, 'timestamp' =>  gmdate("Y-m-d\TH:i:s\Z")));
                            try {
                                $s3->putObject(array(
                                    'Bucket' => $bucketName,
                                    'Key'    => $objectName,
                                    'Body'   => $message
                                ));
                            } catch (Aws\S3\Exception\S3Exception $e) {
                                echo 'There was an error uploading the file.\n';
                                print_r($e);
                            }

                            echo '<h4>Message generated and sent : ' . $message . '</h4>';
                            echo '<h4 style="margin-top:20px;"><a href="?action=check&id=' . $id . '">Check message in the output bucket</a></h4>';
                            $messages[date("Y-m-d H:i:s")] = $id;
                            file_put_contents(MSG_FILENAME, '<?php return ' . var_export($messages, true) . ';');
                        break;

                        case 'check':
                            $id = $_REQUEST['id'];
                            $bucketName = $config['bucket-output'];
                            $objectName = 'message-' . $id;
                            try {
                                $message = $s3->getObject(array(
                                    'Bucket' => $bucketName,
                                    'Key'    => $objectName,
                                ));
                            } catch (Aws\S3\Exception\S3Exception $e) {
                                echo '<h4>There was an error fetching message: ' . $id . '<br/><br/>Did you just create that message? If yes, you may want to try in a few seconds.</h4>';
                                echo '<h4 style="margin-top:20px;"><a href="?action=check&id=' . $id . '">Check again</a></h4>';
                            }

                            if (isset($message['Body'])) {
                                echo '<h4 class="bg-success" style="padding:10px;">Message was succesfully received in the output bucket!</h4><pre>Message: ' . $message['Body'] . '</pre>';
                                echo '<pre>Datetime when message was stored in the output bucket: ' . var_export($message['@metadata']['headers']['last-modified'], true) . '</pre>';
                            }
                        break;

                        case 'deactivate':
                            $json = isset($_REQUEST['replicationConfiguration']) ? $_REQUEST['replicationConfiguration'] : null;
                            if ($json) {
                                $replicationConfiguration = json_decode($json, true);
                                $replicationConfiguration['Rules'][0]['Status'] = 'Disabled';
                                $bucketName = $config['bucket-input'];
                                $replicationStatus = 'n/a';
                                try {
                                    $response = $s3->putBucketReplication(array(
                                        'Bucket' => $bucketName,
                                        'ReplicationConfiguration' => $replicationConfiguration,
                                    ));
                                    var_dump($response);
                                } catch (Aws\S3\Exception\S3Exception $e) {
                                    echo '<h4>Error while de-activating the S3 configuration rule.</h4>';
                                    var_dump($e);
                                }
                            }
                        break;

                        case 'replication':
                            $bucketName = $config['bucket-input'];
                            $replicationStatus = 'n/a';
                            try {
                                $configReplication = $s3->getBucketReplication(array(
                                    'Bucket' => $bucketName
                                ));
                                $replicationStatus = isset($configReplication['ReplicationConfiguration']['Rules'][0]['Status']) ? $configReplication['ReplicationConfiguration']['Rules'][0]['Status'] : 'n/a';
                            } catch (Aws\S3\Exception\S3Exception $e) {
                                echo '<h4>Error while fetching S3 configuration rule.</h4>';
                                var_dump($e->errorMessage);
                            }
                            echo 'Current status of the S3 Replication : <strong>' . $replicationStatus . '</strong>';
                            if ($replicationStatus == 'Enabled') {
?>
                                <form id='frm' action='?action=deactivate' method='post'style="margin-top:20px;">
                                     <input type="hidden" id="replicationConfiguration" name="replicationConfiguration" value='<?php echo json_encode($configReplication['ReplicationConfiguration']); ?>' />
                                     <input class="btn btn-success btn-lg" type='submit' id='submit' name='submit' value='Deactivate replication, I will build my own RGM' />
                                </form>
<?php
                            }
                        break;

                        case 'instructions':
?>
                            <h1>Initial Rube Goldberg Machine (RBM) in AWS</h1>
                            <p class="lead">A simple RBM - send a message via this webapp that will get automatically replicated from one S3 bucket to another. The message is kept as-is and thereplication happens within 15 minutes (usually much faster).</p>
                            <img src="img/1.png" />

                            <p class="lead">You can also use this webapp to check if the message has been successfully delivered into the output/destination bucket.</p>
                            <img src="img/2.png" />

                            <h1>Create your own Rube Goldberg Machine in AWS</h1>
                            <p class="lead"><a href="?action=replication">Deactivate the S3 replication</a> and replace it with your own RBM. You have to make sure that the message in the inputbucket ultimately gets delivered in the output bucket. Make sure to read the rules of engagement below.</p>
                            <img src="img/3.png" />

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
                                <li class="list-group-item">Every team starts with 0 point. Again, the services used by the initial RBM do not count (e.g. S3, EC2 instance). Therefore, you willget points if you use those in your RBM.</li>
                                <li class="list-group-item">You can use the console to provision and configure the new resources. If you automate the creation and configuration of a specific service via a script (e.g. cloudformation), you will double your points for that specific service.</li>
                                <li class="list-group-item">If you have a question or are stuck, don't hesitate to ask for some help from an AWS specialist.</li>
                              </ol>
                            </div>
<?php
                        break;

                        default:
                    ?>
                            <form id='frm' action='?action=send' method='post'>
                                 <input class="btn btn-success btn-lg" type='submit' id='submit' name='submit' value='Something for nothing...' />
                            </form>
                    <?php
                            if (!empty($messages)) {
                                echo '<h4 style="margin-top:40px;">Previous messages (oldest first)</h4><ul>';
                                foreach ($messages as $time => $message) {
                                    echo '<li>[' . $time . '] <a href="?action=check&id=' . $message . '">' . $message . '</a></li>';
                                }
                                echo '</ul>';
                            }
                        break;
                    }
                    ?>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
