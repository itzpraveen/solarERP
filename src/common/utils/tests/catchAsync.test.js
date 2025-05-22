const catchAsync = require('../catchAsync');

describe('catchAsync Utility', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset mocks for each test to ensure test isolation
    mockReq = {};
    mockRes = {}; // res is not typically used by catchAsync directly but passed to fn
    mockNext = jest.fn();
  });

  it('should call the wrapped function and not call next() if promise resolves', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = catchAsync(mockFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() with the error if promise rejects', async () => {
    const testError = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(testError);
    const wrappedFn = catchAsync(mockFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(testError);
  });
});
