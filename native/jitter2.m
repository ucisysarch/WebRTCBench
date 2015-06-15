%%initialization
clear ; close all; clc

%% ======================= Part 1: Plotting =======================
fprintf('Plotting Data ...\n')
data = load('./output/jitter2.data');
X = data(:, 1);

% Plot Data
% Note: You have to complete the code in plotData.m
%plotData(X, y);


plot(X, 'rx','markersize',4);
ylabel('Jitter(ms)');
xlabel('Frame Number');

figure;
hist(X);
ylabel('Percentage(%)');
xlabel('Jitter(ms)');



fprintf('Program paused. Press enter to continue.\n');
pause;
