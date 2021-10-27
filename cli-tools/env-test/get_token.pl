#!/usr/bin/env perl
my $token_opt = '--token';
my $log_opt = '--log';
my $token_flag, $log_flag;
my $api, $token;

foreach my $arg (@ARGV) {
   if($arg eq $token_opt){
      $token_flag=1
   }elsif($arg eq $log_opt){
      $log_flag=1
   }elsif($token_flag && !$token){
      $token=$arg
   }else{
      $api=$arg
   }
}
# print "api=$api, token=$token, token_flag=$token_flag, log_flag=$log_flag\n";

if(!$api){
   print "Usage: \n";
   print "  $0 <api> [--token] [--log]\n";
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


if($token_flag){
   if(!$token){
      my $in_t = 'app.token';
      $token = &get_data($in_t);
   }
}


## main
if($token){
   if($print_log){
      print "curl -s -H \"Content-Type:application/json\" -H \"Authorization:Bearer $token\" -X GET $api\n";
   }
   print `curl -s -H \"Content-Type:application/json\" -H \"Authorization:Bearer $token\" -X GET $api`;
}else{
   if($print_log){
      print "curl -s -H \"Content-Type:application/json\" -X GET $api\n";
   }
   print `curl -s -H \"Content-Type:application/json\" -X GET $api`;
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

