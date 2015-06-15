%%initialization
clear ; close all; clc

%% ======================= Part 1: Plotting =======================
fprintf('Plotting Data ...\n')
data = load('./output/latency.data');
X = data(:, 1);

% Plot Data
% Note: You have to complete the code in plotData.m
%plotData(X, y);


plot(X, 'rx','markersize',4);
ylabel('latency(ms)');
xlabel('Frame Number');

figure;
hist(X);
ylabel('Frequency');
xlabel('latency(ms)');



fprintf('Program paused. Press enter to continue.\n');
pause;
