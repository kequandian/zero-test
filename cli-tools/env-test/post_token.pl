#!/usr/bin/env perl
my $token_opt = '--token';
my $log_opt = '--log';
my $token_flag,$token,$print_log;
my $method, $api, $data;

foreach my $arg (@ARGV) {
   if($arg eq $token_opt){
      $token_flag=1;
   }elsif($arg eq $log_opt){
      $print_log=1;
   }elsif($token_flag && !$token){
      $token=$arg;
   }elsif(!$method){
      $method=$arg;
   }elsif(!$api){
      $api=$arg;
   }elsif(!$data){
      $data=$arg;
   }
}
if ( $data ){
   $data =~ s/nbsp/ /g;
}
if (! $data ){
   $data = "{}";
}
# print "method=$method, api=$api, data=$data, token=$token, token_flag=$token_flag, log_flag=$log_flag\n";
if(!($method eq 'POST' || $method eq 'PUT' 
                   || $method eq 'DELETE' || $method eq 'PATCH')  
 ){
   print "Usage: \n";
   print "  $0 <token_tag> <method> <api> <data> [--token] <token> [--log]\n";
   print "    Options:\n";  
   print "       method   -- [POST, PUT, DELETE, PATCH]\n";  
   exit(0);
}

if( $data ){
   #$data = '\''.$data.'\'';
   #print $data."\n";
   if( -e $data ){
      ## get data from content
      $data = &get_data($data);
      $data =~ s/[\r\n\t]//g;

      if( ! $data ){
         print "Usage: $0 <POST|PUT|DELETE|PATCH> <api> <data> --token\n";
	      exit(0);
      }
      #print $data;
   }
   $data = '\''.$data.'\'';
}
$data=~s/\s+/ /g;
#print "$data\n";
#my $result= `echo $data | iconv -t "UTF-8"`;


if($api =~ /^http/){
}else{
   my $in = 'app.endpoint';
   my $endpoint;

   my @lines = &get_lines($in);
   foreach (@lines){
      if(/^[\t\n\r\s]+$/){
      }elsif(/^\#/){
      }else{
         $endpoint = $_;
      }
   }
   #my $endpoint = &get_data($in);
   $endpoint =~ s/[\/\r\n]+$//;
   $api = $endpoint.$api;
}

if(!$token){
   my $in_t = 'app.token';
   $token = &get_data($in_t);
}

## pring log
if($token_flag){
   if($print_log){
      print "curl -s -H \"Content-Type:application/json\" -H \"Authorization:Bearer $token\" -X $method -d $data $api\n";
   }
   print `curl -s -H "Content-Type:application/json; charset=UTF-8" -H "Authorization:Bearer $token" -X $method -d $data $api`;
}else{
    if($print_log){
      print "curl -s -H \"Content-Type:application/json\" -X $method -d $data $api\n";
   }
   print `curl -s -H "Content-Type:application/json" -X $method -d $data $api`;
}



##########################
## function
#########################
sub get_lines {
   my $in = shift;
   my @lines;
   if(-e $in){
      open my $fh, "<", "$in";
        @lines = <$fh>;
      close $fh;
   }
   return @lines;
}

sub get_data {
  my $in = shift;
  if( -e $in){
     my $content;
     local $/; #Enable 'slurp' mode
     open my $fh, "<", "$in";
        $content = <$fh>;
     close $fh;
     $content =~ s/[\r\n\t]+//;
     return $content;
  }
  return $in;
}

