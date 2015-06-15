%%initialization
clear ; close all; clc

%% ======================= Part 1: Plotting =======================
fprintf('Plotting Data ...\n')
data = load('./output/callback.data');
X = data(:, 1);

% Plot Data
% Note: You have to complete the code in plotData.m
%plotData(X, y);


plot(X, 'r*','markersize',3);
ylabel('CALLBACK Interval(ms)');
xlabel('NO.');

figure;
hist(X);
ylabel('Frequency Number');
xlabel('CALLBACK Interval(ms)');



fprintf('Program paused. Press enter to continue.\n');
pause;
