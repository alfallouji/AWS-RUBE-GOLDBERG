#!/bin/bash

sudo amazon-linux-extras install -y php7.2 
sudo yum install -y php-xml

sudo yum install -y httpd git
sudo systemctl start httpd
sudo systemctl enable httpd

cd /tmp/
git clone https://github.com/alfallouji/AWS-RUBE-GOLDBERG.git
sudo mv AWS-RUBE-GOLDBERG/webapp/* /var/www/html/. 
sudo chown apache:apache /var/www/html/ -R

cd /var/www/html/

sudo php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
sudo php composer-setup.php
sudo php -r "unlink('composer-setup.php');"

sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024
sudo /sbin/mkswap /var/swap.1
sudo /sbin/swapon /var/swap.1

sudo php composer.phar require aws/aws-sdk-php

sudo chown apache:apache /var/www/html/ -R

sudo systemctl restart php-fpm


