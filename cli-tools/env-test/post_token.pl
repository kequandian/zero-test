#!/usr/bin/env perl

my $token_flag = shift @ARGV;
my $method = shift @ARGV;
my $api = shift @ARGV;
my $data = shift @ARGV;
my $print_log = shift @ARGV;

if ( $data ){
   $data =~ s/nbsp/ /g;
}
if (! $data ){
   $data = "{}";
}

if($token_tag eq '--token'){
  $token_flag = 1;
}

if(!($method eq 'POST' || $method eq 'PUT' 
                   || $method eq 'DELETE' || $method eq 'PATCH')  
 ){
   print "Usage: \n";
   print "  $0 <token_tag> <method> <api> <data> [--log]\n";
   print "    Options:\n";  
   print "       token_tag : --token,--no-token\n";
   print "       method    : [POST, PUT, DELETE, PATCH]\n";  
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
          print "Usage: $0 --token <POST|PUT|DELETE|PATCH> <api> <data>\n";
	  exit(0);
      }

      #print $data;
   }
   $data = '\''.$data.'\'';
}


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

my $token;
if($token_flag){
   my $in_t = 'app.token';
   $token = &get_data($in_t);
}


$data=~s/\s+/ /g;
#print "$data\n";
#my $result= `echo $data | iconv -t "UTF-8"`;

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

