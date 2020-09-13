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
sudo php -r "if (hash_file('sha384', 'composer-setup.php') === '8a6138e2a05a8c28539c9f0fb361159823655d7ad2deecb371b04a83966c61223adc522b0189079e3e9e277cd72b8897') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
sudo php composer-setup.php
sudo php -r "unlink('composer-setup.php');"

sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024
sudo /sbin/mkswap /var/swap.1
sudo /sbin/swapon /var/swap.1

sudo php composer.phar require aws/aws-sdk-php

sudo chown apache:apache /var/www/html/ -R

sudo systemctl restart php-fpm


