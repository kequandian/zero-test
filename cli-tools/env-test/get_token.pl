#!/usr/bin/perl

my $token_tag = shift @ARGV;
my $api = shift @ARGV;

my $print_log = shift @ARGV;
## token
my $token_flag;
if($token_tag eq '--token'){
   $token_flag = 1;
}

if(!$api){
   print "Usage: \n";
   print "  $0 <token> <api> [--log]\n";
   print "  token: --token,--no-token\n"; 
   exit(0);
}

if($api =~ /\?/){
  $api=~ s/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/\"$1-$2-$3 $4:$5:$6\"/g;
}
if($api =~ /\&/){
  $api=~ s/\&/\\\&/g;
}

if( $api =~ /^http/){
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


if($print_log){
   if($token_flag){
      print "curl -H \"Content-Type:application/json\" -H \"Authorization:Bearer $token\" -X GET $api\n";
   }else{
      print "curl -H \"Content-Type:application/json\" -X GET $api\n";
   }
}

if($token_flag){
   print `curl -H \"Content-Type:application/json\" -H \"Authorization:Bearer $token\" -X GET $api`;
}else{
   print `curl -H \"Content-Type:application/json\" -X GET $api`;
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

  my $content;
  local $/; #Enable 'slurp' mode

  open my $fh, "<", "$in";
     $content = <$fh>;
  close $fh;

  $content =~ s/[\r\n\t]+//;

  return $content;
}

