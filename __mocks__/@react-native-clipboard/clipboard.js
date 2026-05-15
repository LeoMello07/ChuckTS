module.exports = {
  default: {
    setString: jest.fn(),
    getString: jest.fn().mockResolvedValue(''),
  },
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
};
