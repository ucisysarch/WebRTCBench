#include <iostream> // for standard I/O
#include <string>   // for strings
#include <iomanip>  // for controlling float print precision
#include <sstream>  // string to number conversion
#include <fstream>

#include <opencv2/core/core.hpp>        // Basic OpenCV structures (cv::Mat, Scalar)
#include <opencv2/imgproc/imgproc.hpp>  // Gaussian Blur
#include <opencv2/highgui/highgui.hpp>  // OpenCV window I/O
#include <opencv2/ml/ml.hpp>

using namespace std;
using namespace cv;

#define ND 3
#define TBS 20

int predict(Mat &src);
CvSVM svm;

void help()
{
	cout << endl;
	cout << "/////////////////////////////////////////////////////////////////////////////////" << endl;
	cout << "This program measures WebRTC Video latency" << endl;
	cout << "USAGE: ./latency senddata recvdata" << endl;
	cout << "For example: ./latency ./Data/senddata.txt recvdata.txt" << endl;
	cout << "/////////////////////////////////////////////////////////////////////////////////" << endl << endl;
}

vector<pair<unsigned int, unsigned long long> > sender;
vector<pair<unsigned int, unsigned long long> > receiver;

int main(int argc, char *argv[])
{
	if(argc != 3)
	{
		help();
		return -1;
	}

	ifstream send_tag(argv[1]);
	ifstream recv_tag(argv[2]);
	
	if(!send_tag || !recv_tag)
	{
		cout << "can't not open file" << endl;
		return -1;
	}

	int v(0);
	unsigned int r, g, b;
	const int width = ND*TBS;
	int height = TBS;
	
	char c;
	svm.load( "./native/ml/SVM_DATA.xml" );
	

//////////////////////////////////////////////////////////Load data ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	int lasts = -1;
	int lastr = -1;

	for(;;)
	{
		////////////////////////////////////////Get sender data/////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////
		Mat image(height, width, CV_8UC3);
		unsigned long long int t(0);
		send_tag >> t;
		send_tag >> c;

		for(int i = 0;i < height;i++)
		{
			for(int j = 0;j < width;j++)
			{
				send_tag >> v;
				send_tag >> c;
				
				r = v & 0xff;
				g = (v >> 8) & 0xff;
				b = (v >> 16) & 0xff;
				
				image.at<Vec3b>(i, j)[0] = b; 
				image.at<Vec3b>(i, j)[1] = g;
				image.at<Vec3b>(i, j)[2] = r;
			}
		}

		Mat ROI;
		int framenum(0);
		for(int k = 0;k < ND;k++)
		{
			ROI = image(Rect(k*20, 0, 20, 20));
			int num = predict(ROI);
			framenum = framenum*10 + num;
		}
		//cout << "timestamp : " << t << "   FrameNum : " << framenum << endl;
		
		if(lasts != framenum)
		{
			sender.push_back(make_pair(framenum, t));
			lasts = framenum;
		}
		
		
		///////////////////////////////Now get receiver data///////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////
		recv_tag >> t;
		recv_tag >> c;
		Mat ROI2;

		for(int i = 0;i < height;i++)
		{
			for(int j = 0;j < width;j++)
			{
				recv_tag >> v;
				recv_tag >> c;
				
				r = v & 0xff;
				g = (v >> 8) & 0xff;
				b = (v >> 16) & 0xff;
				
				image.at<Vec3b>(i, j)[0] = b; 
				image.at<Vec3b>(i, j)[1] = g;
				image.at<Vec3b>(i, j)[2] = r;
			}
		}

		framenum = 0;
		for(int k = 0;k < ND;k++)
		{
			ROI2 = image(Rect(k*20, 0, 20, 20));
			int num = predict(ROI2);
			framenum = framenum*10 + num;
		}
		//cout << "timestamp : " << t << "   FrameNum : " << framenum << endl;
		
		if(lastr != framenum)
		{
			receiver.push_back(make_pair(framenum,t));
			lastr = framenum;
		}
		
		///////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////

		
		if(recv_tag.eof() || send_tag.eof())
			break;
	}
	
	
	////////////////////////////////////////check data/////////////////////////////////////////
	/*for(int i = 0;i < sender.size();i++)
	{
		cout << sender[i].first << " " << sender[i].second << endl;
	}
	cout << "/////////////////////////////////////////////////////////////////" << endl;
	for(int i = 0;i < receiver.size();i++)
	{
		cout << receiver[i].first << " " << sender[i].second << endl;
	}
	cout << "/////////////////////////////////////////////////////////////////" << endl;*/
	
	ofstream of("./native/output/latency.data");
	for(int i = 0;i < sender.size();i++)
	{
		unsigned int frameNumber = sender[i].first;
		unsigned long long senderTime = sender[i].second;
		
		for(int j = 0;j < receiver.size();j++)
		{
			//cout << i << "  " << j  << " " << receiver[j].second - senderTime  << endl;
			if(frameNumber == receiver[j].first && receiver[j].second - senderTime < 1000)
			{
				cout << receiver[j].second - senderTime << endl;
				of << receiver[j].second - senderTime << endl;
				break;
			}
		}
		
	}
	
	of.close();
	return 0;
	
}


//////////////////////////////////////////////////////////predict function//////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


int predict(Mat &src)
{
	Mat gray;
	cvtColor(src, gray, CV_RGB2GRAY);
	Mat dst(1, 400, CV_32FC1);
	
	for(int i = 0;i < 20;i++)
    {
    	for(int j = 0;j < 20;j++)
       	{
			dst.at<float>(i+20*j) = gray.at<unsigned char>(i,j);
    	}
    }

    int n = svm.predict(dst);
    return n;
}
