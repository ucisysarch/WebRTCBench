%%initialization
clear ; close all; clc

%% ======================= Part 1: Plotting =======================
fprintf('Plotting Data ...\n')
data = load('./output/jitter.data');
X = data(:, 1); y = data(:, 2);
m = length(y); % number of training examples

% Plot Data
% Note: You have to complete the code in plotData.m
%plotData(X, y);

_X = X - X(1)
_y = y - y(1)
plot(_X, 'k.');
ylabel('Time(Milliseconds)');
xlabel('Frame Number');

%plotData(_X, _y);



fprintf('Program paused. Press enter to continue.\n');
pause;
