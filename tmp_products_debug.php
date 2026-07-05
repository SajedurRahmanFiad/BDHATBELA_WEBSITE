<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['list'] = '1';
$_GET['limit'] = '8';
$_GET['page'] = '1';
$_GET['sort'] = 'newest';
chdir(__DIR__ . '/backend');
require 'api/products.php';
