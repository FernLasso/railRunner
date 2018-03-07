if (isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) == 'on') {
  $base_url = 'https://railrunners.herokuapp.com';
}
else {
  $base_url = 'http://railrunners.herokuapp.com';
}