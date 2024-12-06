const fs = require('fs');
const path = require('path');
const process = require('process');

class nzfsdb {
	path;

	constructor(dir) {
		this.path = path.normalize(dir);
		console.log(this.path);
		try {
			if (!fs.existsSync(this.path)) fs.mkdirSync(this.path, { recursive: true });
		} catch(e) {
			console.log(e);
			process.exit(1);
		}
	}

	validateName(name) {
		try {
			const regex = /[<>^:"\/\\|?*\x00-\x1F]|^(?:aux|con|clock\$|nul|prn|com[1-9]|lpt[1-9])$/i;
			return !regex.test(name);
		} catch(e) {
			console.log(e);
			return false;
		}
	}
	
	stat(dir) {
		try {
			fs.statSync(dir);
			return true;
		} catch {
			return false;
		}
	}

	checkPath(dir = null) {
		try {
			if (dir === null) {
				dir = this.path;
			} else if (typeof dir === 'string') {
				dir = path.normalize(path.join(this.path, dir));
			} else {
				return false;
			}
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
			return dir;
		} catch(e) {
			console.log('\x1b[1m%s\x1b[0m', `Failed to check path:`, e);
			return false;
		}
	}

	checkExists(dir = null, file = null) {
		try {
			dir = this.checkPath(dir);
			if (!dir) throw new Error('no appropriate directory');

			if (file !== null) {
				if ((this.validateName(file)) === true) {
					if (!fs.existsSync(path.normalize(path.join(dir, file)))) return false;
				} else {
					throw new Error(file, '- The file name is invalid');
				}
			}

			return {dir, file};

		} catch(e) {
			console.log('\x1b[1m%s\x1b[0m', `Failed to check exists:`, e);
			return false;
		}
	}

	read(dir = null, file = null) {
		let obj = this.checkExists(dir, file) || false;
		let result = {};
		try {
			if (!obj) throw new Error('the object being read does not exist');
			if (obj.file === null) {
				let files = fs.readdirSync(obj.dir);
				let j = 0;
				for (var i in files) {
					var name = path.normalize(path.join(obj.dir, files[i]));
					if (!fs.statSync(name).isDirectory()) {
						result[j] = files[i];
						j++;
					}
				}
				return result;
			} else if (typeof obj.file === 'string') {
				result = fs.readFileSync(path.normalize(path.join(obj.dir, obj.file)), 'utf8');
			} else {
				return false;
			}
		} catch(e) {
			console.log('Error:', e);
			return false;
		}
		return result;
	}

	write(dir = null, file = null, string = '') {
		let obj = this.checkExists(dir, null) || false;
		try {
			if ((obj)
			&& ((this.validateName(file)) === true)
			&& (typeof string === 'string')) {
				fs.writeFileSync(path.normalize(path.join(obj.dir, file)), string);
				return true;
			} else {
				return false;
			}
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	delete(dir = null, file = null) {
		let obj = this.checkExists(dir, file) || false;
		let result = true;
		try {
			if (!obj) throw new Error('the object being deleted does not exist');
			if (obj.file === null) {
				fs.rmSync(obj.dir, { recursive: true });
				if (this.stat(obj.dir)) throw new Error('failed to delete directory');
			} else if (typeof obj.file === 'string') {
				fs.unlinkSync(path.normalize(path.join(obj.dir, obj.file)));
				if (this.checkExists(dir, file)) throw new Error('failed to delete file');
			} else {
				return false;
			}
		} catch(e) {
			console.log('Error:', e);
			return false;
		}
		return result;
	}

}

module.exports = nzfsdb;
