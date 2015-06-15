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
#define INTERVAL 1000.0/30.0

int predict(Mat &src);
CvSVM svm;

void help()
{
	cout << endl;
	cout << "/////////////////////////////////////////////////////////////////////////////////" << endl;
	cout << "This program measures Frame Loss Rate" << endl;
	cout << "USAGE: ./flr yourdata" << endl;
	cout << "For example: ./flr ./Data/tag_receive.txt" << endl;
	cout << "/////////////////////////////////////////////////////////////////////////////////" << endl << endl;
}

vector<pair<unsigned long long, unsigned int> > datas;

int main(int argc, char *argv[])
{
	if(argc != 2)
	{
		help();
		return -1;
	}

	ifstream received_tag(argv[1]);
	
	if(!received_tag)
	{
		cout << "can't not open file" << endl;
		return -1;
	}

	
	const char* WIN_RF = "Reference";
    namedWindow(WIN_RF, CV_WINDOW_AUTOSIZE);
    cvMoveWindow(WIN_RF, 400       , 0);

	int v(0);
	unsigned int r, g, b;
	int width = 60;
	int height = 20;
	
	char c;
	svm.load( "./native/ml/SVM_DATA.xml" );
	
	
	
//////////////////////////////////////////////////////////Load data ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	unsigned long long lastt = 0;
	int lastf = -1;
	ofstream ofile3("./native/output/callback.data");
	for(;;)
	{
		Mat image(height, width, CV_8UC3);
		unsigned long long int t(0);
		received_tag >> t;
		received_tag >> c;

		for(int i = 0;i < height;i++)
		{
			for(int j = 0;j < width;j++)
			{
				received_tag >> v;
				received_tag >> c;
				
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
		
		
		/////////////////////////////////////////
		/////////////save callback time//////////
		if(lastt > 0)
		{
			ofile3 << (t - lastt) << endl;
		}
		lastt = t;
		/////////////////////////////////////////
		
		
		
		
 
		if(lastf != framenum)
		{
			datas.push_back(make_pair(t, framenum));
			lastf = framenum;
		}
		
		//imshow(WIN_RF, image);
		
		if(received_tag.eof())
			break;
	}
	
	ofstream ofile("./native/output/jitter.data");
	for(int i = 1;i < datas.size();i++)
	{
		ofile << datas[i].first << " " << datas[i].second << endl;
	}
	
	
	//cout << "---------------------------------------------------------------------------------------" << endl;
	//cout << "---------------------------------------jitter------------------------------------------" << endl;
	//cout << "---------------------------------------------------------------------------------------" << endl;
	
	ofstream ofile2("./native/output/jitter2.data");
	for(int i = 2;i < datas.size();i++)
	{
		cout << abs(datas[i].first - datas[i-1].first - INTERVAL) << endl;
		ofile2 << abs(datas[i].first - datas[i-1].first - INTERVAL) << endl;
	}
	
	ofile.close();
	ofile2.close();
	ofile3.close();

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
