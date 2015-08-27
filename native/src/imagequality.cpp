#include <iostream> // for standard I/O
#include <string>   // for strings
#include <iomanip>  // for controlling float print precision
#include <sstream>  // string to number conversion
#include <fstream>

#include <opencv2/core.hpp>        // Basic OpenCV structures (cv::Mat, Scalar)
#include <opencv2/imgproc.hpp>  // Gaussian Blur
#include <opencv2/highgui.hpp>  // OpenCV window I/O
#include <opencv2/ml.hpp>

#include <map>

using namespace std;
using namespace cv;
using namespace cv::ml;

#define ND 3

int predict(Mat &src);
double getPSNR ( const Mat& I1, const Mat& I2);
Scalar getMSSIM( const Mat& I1, const Mat& I2);
//CvSVM svm;
Ptr<SVM> svm;

void help()
{
	cout << endl;
	cout << "/////////////////////////////////////////////////////////////////////////////////" << endl;
	cout << "This program measures Frame Loss Rate" << endl;
	cout << "USAGE: ./iq rawdata sourcevideo" << endl;
	cout << "For example: ./iq ./Data/data.txt ./Data/2.y4m" << endl;
	cout << "/////////////////////////////////////////////////////////////////////////////////" << endl << endl;
}

int main(int argc, char *argv[])
{
	if(argc != 3)
	{
		help();
		return -1;
	}

	ifstream received_video(argv[1]);
	
	if(!received_video)
	{
		cout << "can't not open file" << endl;
		return -1;
	}
	
	const string originVideoName = argv[2];
	VideoCapture originVideo(originVideoName);
	if (!originVideo.isOpened())
    {
        cout  << "Could not open original video " << originVideoName << endl;
        return -1;
    }
    map<int, Mat> originImages;
	
	const char* WIN_RF = "Reference";
    namedWindow(WIN_RF, CV_WINDOW_AUTOSIZE);
    cvMoveWindow(WIN_RF, 400       , 0);

	int v(0);
	unsigned int r, g, b;
	int width(640);
	int height(480);
	
	char c;
	//svm.load( "./native/ml/SVM_DATA.xml" );
        svm = StatModel::load<SVM>( "./native/ml/SVM_DATA.xml" );
	
	
/////////////////////////////////////////Load original video to map ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	Mat frameReference;
	for(;;)
	{
		originVideo >> frameReference;
		if(frameReference.empty()) 
			break;
		width = frameReference.cols;
		height = frameReference.rows;
		Mat ROI;
		int framenum(0);
		for(int k = 0;k < ND;k++)
		{
			ROI = frameReference(Rect(k*20, 0, 20, 20));
			int num = predict(ROI);
			framenum = framenum*10 + num;
		}
		originImages[framenum] = frameReference;
	}
	
	
	
////////////////////////////////////////////////////////// test/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	cout << endl << endl << endl;

	map<int, Mat>::iterator it;
	cout << endl << originImages.size() << endl;
	for(it = originImages.begin(); it != originImages.end(); it++)
	{
		Mat m = it->second;
		int index = it->first;
		
		cout << index;
		imshow(WIN_RF, m);
		cvWaitKey(100);
	}
	return 0;
	cvWaitKey(111111);
	*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	

//////////////////////////////////////////////////////////Load data ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	ofstream f1("./native/output/imagequality.data");
	if(!received_video)
	{
		cout << "can't open outputfile file [/output/imagequality.txt]" << endl;
		return -1;
	}
	
	for(;;)
	{
		Mat image(height, width, CV_8UC3);
		for(int i = 0;i < height;i++)
		{
			for(int j = 0;j < width;j++)
			{
				received_video >> v;
				received_video >> c;
				r = v & 0xff;
				g = (v >> 8) & 0xff;
				b = (v >> 16) & 0xff;
				
				//cout << v << " " << r << " " << g << " " << b << "    " << c << endl;
				
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
		
		float psnr = getPSNR(image, originImages[framenum]);
		Scalar ssim = getMSSIM(image, originImages[framenum]);
		cout <<  psnr << endl << (ssim[0]+ssim[1]+ssim[2])/3 << endl;

		//imshow(WIN_RF, image);
		
		//cvWaitKey(1000);
		
		if(received_video.eof())
			break;
	}
	f1.close();
        //cout<<"done"<<endl;
        svm.release();
	return 0;
	
}


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

    int n = svm->predict(dst);
    return n;
}

double getPSNR(const Mat& I1, const Mat& I2)
{
    Mat s1;
    absdiff(I1, I2, s1);       // |I1 - I2|
    s1.convertTo(s1, CV_32F);  // cannot make a square on 8 bits
    s1 = s1.mul(s1);           // |I1 - I2|^2

    Scalar s = sum(s1);        // sum elements per channel

    double sse = s.val[0] + s.val[1] + s.val[2]; // sum channels

    if( sse <= 1e-10) // for small values return zero
        return 0;
    else
    {
        double mse  = sse / (double)(I1.channels() * I1.total());
        double psnr = 10.0 * log10((255 * 255) / mse);
        return psnr;
    }
}

Scalar getMSSIM( const Mat& i1, const Mat& i2)
{
    const double C1 = 6.5025, C2 = 58.5225;
    /***************************** INITS **********************************/
    int d = CV_32F;

    Mat I1, I2;
    i1.convertTo(I1, d);            // cannot calculate on one byte large values
    i2.convertTo(I2, d);

    Mat I2_2   = I2.mul(I2);        // I2^2
    Mat I1_2   = I1.mul(I1);        // I1^2
    Mat I1_I2  = I1.mul(I2);        // I1 * I2

    /*************************** END INITS **********************************/

    Mat mu1, mu2;                   // PRELIMINARY COMPUTING
    GaussianBlur(I1, mu1, Size(11, 11), 1.5);
    GaussianBlur(I2, mu2, Size(11, 11), 1.5);

    Mat mu1_2   =   mu1.mul(mu1);
    Mat mu2_2   =   mu2.mul(mu2);
    Mat mu1_mu2 =   mu1.mul(mu2);

    Mat sigma1_2, sigma2_2, sigma12;

    GaussianBlur(I1_2, sigma1_2, Size(11, 11), 1.5);
    sigma1_2 -= mu1_2;

    GaussianBlur(I2_2, sigma2_2, Size(11, 11), 1.5);
    sigma2_2 -= mu2_2;

    GaussianBlur(I1_I2, sigma12, Size(11, 11), 1.5);
    sigma12 -= mu1_mu2;

    ///////////////////////////////// FORMULA ////////////////////////////////
    Mat t1, t2, t3;

    t1 = 2 * mu1_mu2 + C1;
    t2 = 2 * sigma12 + C2;
    t3 = t1.mul(t2);                 // t3 = ((2*mu1_mu2 + C1).*(2*sigma12 + C2))

    t1 = mu1_2 + mu2_2 + C1;
    t2 = sigma1_2 + sigma2_2 + C2;
    t1 = t1.mul(t2);                 // t1 =((mu1_2 + mu2_2 + C1).*(sigma1_2 + sigma2_2 + C2))

    Mat ssim_map;
    divide(t3, t1, ssim_map);        // ssim_map =  t3./t1;

    Scalar mssim = mean(ssim_map);   // mssim = average of ssim map
    return mssim;
}
