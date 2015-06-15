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

ifstream images;

#define TOTAL 5000

int main()
{
	string filename = "./ml/image.txt";
	const char* WIN_RF = "Reference";
	char c;
	images.open(filename.c_str());
	
	
	if(!images) 
	{
		cout << "Open file ERROR!!!" << endl;
		return -1;
	}
	
	namedWindow(WIN_RF, CV_WINDOW_AUTOSIZE);
    cvMoveWindow(WIN_RF, 400       , 0);
    
    Mat data = Mat::zeros(TOTAL, 400, CV_32FC1);
    Mat label = Mat::zeros(TOTAL, 1, CV_32FC1);
    
    Mat sampleMat = Mat::zeros(400, 1, CV_32FC1);
	
	for(int k = 0;k < TOTAL;k++)
	{
		
		string tag;
		images >> tag;
		cout << tag << endl;
		
		float v;
		Mat I = Mat::zeros(20, 20, CV_32FC1);
		
		for(int i = 0;i < 20;i++)
		{
			for(int j = 0;j < 20;j++)
			{
				images >> v;
				float _v = 1.0 * (int)(v*255+0.5);
				if(_v >= 255.0f) _v = 255.0f;
				if(_v < 0) _v = 0.0f;
				I.at<float>(i,j) = _v;
				data.at<float>(k, j + 20*i) = _v;
			}
		}
		label.at<float>(k) = k/500;

		
		if(k == 1900) 
		{
			int index = 0;
			MatIterator_<float> it, end;
            for( it = I.begin<float>(), end = I.end<float>(); it != end; ++it)
            {
                sampleMat.at<float>(index,1) = *it;
                index++;
            }
            //cout << index << endl;
		}
		
		//Mat dst = Mat::zeros(200,200,CV_8UC1);
		//resize(I, dst, dst.size());
		//imshow(WIN_RF, dst);

        //c = (char)cvWaitKey(1000);
        //if (c == 27) break;
	
	}
	
	
	CvSVM svm;
	CvSVMParams params;
	CvTermCriteria criteria;
	
	criteria = cvTermCriteria(CV_TERMCRIT_EPS, 1000, FLT_EPSILON);
	//param = CvSVMParams(CvSVM::C_SVC, CvSVM::RBF, 10.0, 8.0, 1.0, 10.0, 0.5, 0.1, NULL, criteria);
	params.svm_type    = SVM::C_SVC;
    params.C           = 0.1;
    params.kernel_type = SVM::LINEAR;
    params.term_crit   = TermCriteria(CV_TERMCRIT_ITER, (int)1e7, 1e-6);
	
	svm.train(data, label, Mat(), Mat(), params);
	svm.save( "./ml/SVM_DATA2.xml" );
	
	return 0;
}
