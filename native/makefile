all: iq flr train tag convert latency
.PHONY:all

CC = g++

iq:				imagequality.o
				$(CC) -o iq imagequality.o `pkg-config opencv --cflags --libs`; rm imagequality.o

imagequality.o:	./src/imagequality.cpp
				$(CC) -c ./src/imagequality.cpp


flr:			FLR.o
	    		$(CC) -o flr FLR.o `pkg-config opencv --cflags --libs`; rm FLR.o
	    		
FLR.o:  		./src/FLR.cpp
	    		$(CC) -c ./src/FLR.cpp
	    		
	    		
train:			TRAIN.o
	    		$(CC) -o train train.o `pkg-config opencv --cflags --libs`; rm train.o
	    		
TRAIN.o:  		./src/train.cpp
	    		$(CC) -c ./src/train.cpp
	    		
	    		
tag:			tag.o
	    		$(CC) -o tag tag.o `pkg-config opencv --cflags --libs`; rm tag.o
	    		
tag.o:  		./src/tag.cpp
	    		$(CC) -c ./src/tag.cpp	 
	    		
	    		
convert:		convert.o
	    		$(CC) -o convert convert.o `pkg-config opencv --cflags --libs`; rm convert.o
	    		
convert.o:  	./src/convert.cpp
	    		$(CC) -c ./src/convert.cpp
	    		
	  		
latency:		latency.o
	    		$(CC) -o latency latency.o `pkg-config opencv --cflags --libs`; rm latency.o
	    		
latency.o:  	./src/latency.cpp
	    		$(CC) -c ./src/latency.cpp  	    		

	    
	    
	    	
clean:
		rm -rf *.o flr iq train tag convert latency
