%%initialization
clear ; close all; clc

%% ======================= Part 1: Plotting =======================
fprintf('Plotting Data ...\n')
data = load('./output/imagequality.data');
X = data(:, 1);
Y = data(:, 2);

% Plot Data
% Note: You have to complete the code in plotData.m
%plotData(X, y);


plot(X, Y,'rx','markersize',5);
ylabel('SSIM');
xlabel('PSNR');



fprintf('Program paused. Press enter to continue.\n');
pause;
