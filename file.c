// vim: ts=4 sw=4
#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <time.h>
#include <string.h>
#include <stdlib.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <string.h>
char buf[1024];
unsigned char *uri ;
struct sockaddr_in *remote;
int sock;
int n;
#define SAVE_OK_MSG "Content-Type:text/plain\n\n"
#define LOAD_OK_MSG "Content-Type:text/plain\n\n"
#define CGI_DAEMON 1001
int create_tcp_socket()
{
  int sock;
  if((sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP)) < 0){
    perror("Can't create TCP socket");
    exit(1);
  }
  return sock;
}
int main(void)
{
	char *query = (char *) getenv("QUERY_STRING");
	int n;
	//printf("Content-Type: text/plain;charset=us-ascii\n\n");
	chdir("/var/www/fbp");
	if (query) {
		if (strncmp(query,"save",4)==0) {
			char *cl=(char *) getenv("CONTENT_LENGTH");
			if (cl==NULL) {
				FILE *empty;
				empty = fopen(query+5,"w");
				fclose(empty);
				write(1,SAVE_OK_MSG,strlen(SAVE_OK_MSG));
				write(1,"fail to save",strlen("fail to save"));
				return 0;
			} else {
				n=atoi(cl); 
				if(n<=0){
					FILE *empty;
					empty = fopen(query+5,"w");
					fclose(empty);
					write(1,SAVE_OK_MSG,strlen(SAVE_OK_MSG));
					write(1,"fail to save2",strlen("fail to save2"));
					return 0;				
				}
			}
			char* theAND=strpbrk(query+5,"&_=");
		    if (theAND!=NULL) *(theAND)='\0';
			FILE *out;
			out = fopen(query+5,"w");
			if (out == NULL) {
			    write(1,SAVE_OK_MSG,strlen(SAVE_OK_MSG));
				printf("file %s can not be craeted\n", query+5);
				return -1;
			}
			while(n) {
				int rn=n;
				if(n>=sizeof(buf))rn=sizeof(buf);
				int l = read(0,buf,rn);
				printf("%d bytes %d", l,n);
				if (l == 0) break;
				fwrite(buf,1,l,out);
				n -= l;
			}
			fclose(out);
			write(1,SAVE_OK_MSG,strlen(SAVE_OK_MSG));
			write(1,query+5,strlen(query+5));
			write(1,cl,strlen(cl));
		} else if (strncmp(query,"load",4)==0) {
		    char* theAND=strpbrk(query+5,"&_=");
		    if(theAND!=NULL)*(theAND)='\0';
			int in = open(query+5,O_RDONLY);
			if(in<=0){
				printf("error");
				return 0;
			}
			write(1,LOAD_OK_MSG,strlen(LOAD_OK_MSG));
			while(1) {
				int l = read(in,buf,1024);
				if (l <=0) break;
				write(1,buf,l);
			}
		} else if (strncmp(query,"reload",6)==0) {
		  	sock = create_tcp_socket();
  			remote = (struct sockaddr_in *)malloc(sizeof(struct sockaddr_in *));
  			remote->sin_family = AF_INET;
  			inet_pton(AF_INET, "127.0.0.1", (void *)(&(remote->sin_addr.s_addr)));
  			remote->sin_port = htons(CGI_DAEMON);
  			if (connect(sock, (struct sockaddr *)remote, sizeof(struct sockaddr)) < 0) {
    			perror("Could not connect");
    			exit(1);
  			}
  			char sendbuf[255];
  			sprintf(sendbuf,"GET /reload=%s HTTP/1.0\n\n",query+7);
  			send(sock, sendbuf, strlen(sendbuf), 0);
			fd_set rset;
  			struct timeval tv={2,0};
  			FD_ZERO(&rset);
  			FD_SET(sock,&rset);
  			if (select(sock+1, &rset, NULL, NULL, &tv) > 0){
 	 			n = recv(sock,buf,1496,0);
 	 			if (n<=0) {
 	 				printf("error");
 	 				return -1;
 	 			}
 	 			printf("%s",buf);
  			}else 
  				printf("error");
  			close(sock);
		
		
		}
	}else{
		printf("there is no query\n");
	}
	return 0;
}
