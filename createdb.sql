CREATE DATABASE IF NOT EXISTS webrtcdb;

USE webrtcdb;

CREATE TABLE IF NOT EXISTS peer (
	peer_id INT auto_increment,
	device VARCHAR(64) NOT NULL,
	os VARCHAR(32) NOT NULL,
	browser VARCHAR(32) NOT NULL,
	network VARCHAR(32) NOT NULL,
	PRIMARY KEY(peer_id)
);
	
CREATE TABLE IF NOT EXISTS experiment (
	experiment_id INT auto_increment,
	sender_id INT NOT NULL,
	receiver_id INT NOT NULL,
	stream_type VARCHAR(3) NOT NULL,
	task_setup VARCHAR(2) NOT NULL,
	PRIMARY KEY(experiment_id),
	FOREIGN KEY(sender_id) REFERENCES peer(peer_id),
	FOREIGN KEY(receiver_id) REFERENCES peer(peer_id)
);
	
CREATE TABLE IF NOT EXISTS sender_timings (
	experiment_id INT NOT NULL,
	exp_timestamp BIGINT NOT NULL,
	init_peer_connection INT,
	get_stream_from_device INT,
	open_data_channel INT,
	timing_type_3 INT,
	timing_type_4 INT,
	timing_type_5 INT,
	timing_type_6 INT,
	timing_type_7 INT,
	timing_type_8 INT,
	timing_type_9 INT,
	FOREIGN KEY(experiment_id) REFERENCES experiment(experiment_id)
);
	
CREATE TABLE IF NOT EXISTS receiver_timings (
	experiment_id INT NOT NULL,
	exp_timestamp BIGINT NOT NULL,
	init_peer_connection INT,
	get_stream_from_device INT,
	open_data_channel INT,
	timing_type_3 INT,
	timing_type_4 INT,
	timing_type_5 INT,
	timing_type_6 INT,
	timing_type_7 INT,
	timing_type_8 INT,
	timing_type_9 INT,
	FOREIGN KEY(experiment_id) REFERENCES experiment(experiment_id)
);