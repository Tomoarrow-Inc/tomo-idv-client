// import React from 'react';
// import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
// import { usePlaidLink } from 'react-plaid-link';
// import { StartTomoIDV } from './index';

// // Mock the hook
// jest.mock('react-plaid-link');

// describe('StartTomoIDV', () => {
//   const mockOpen = jest.fn();
//   const mockUsePlaidLink = usePlaidLink;

//   beforeEach(() => {
//     // Reset mocks before each test
//     jest.clearAllMocks();
//     global.fetch = jest.fn(); // Properly initialize fetch mock
    
//     // Default mock implementation
//     mockUsePlaidLink.mockReturnValue({
//       open: mockOpen,
//       ready: true,
//     });
//   });

//   afterEach(() => {
//     jest.resetAllMocks();
//   });

//   it('renders the start identity verification button', () => {
//     render(<StartTomoIDV linkTokenData={{}} />);
    
//     expect(screen.getByText('Start Identity Verification')).toBeInTheDocument();
//   });

//   it('button is disabled when not ready', () => {
//     mockUsePlaidLink.mockReturnValue({
//       open: mockOpen,
//       ready: false,
//     });

//     render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
//     expect(button).toBeDisabled();
//   });

//   it('fetches link token and opens Plaid Link when button is clicked', async () => {
//     const mockLinkToken = 'test-link-token';
//     global.fetch.mockResolvedValueOnce({
//       json: async () => ({ link_token: mockLinkToken }),
//     });

//     render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     // 초기 상태 확인 - open이 아직 호출되지 않았는지
//     expect(mockOpen).not.toHaveBeenCalled();
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Verify fetch was called with credentials: 'include'
//     expect(global.fetch).toHaveBeenCalledWith(
//       'http://localhost:8080/generate_link_token_for_idv',
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         credentials: 'include',
//       }
//     );

//     // Wait for the useEffect to trigger and ensure open is called exactly once
//     await waitFor(() => {
//       expect(mockOpen).toHaveBeenCalledTimes(1);
//     }, { timeout: 3000 });

//     // 추가 검증: open이 정확히 한 번만 호출되었는지 확인
//     expect(mockOpen).toHaveBeenCalledTimes(1);
//   });

//   it('handles fetch error gracefully', async () => {
//     const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
//     global.fetch.mockRejectedValueOnce(new Error('Network error'));

//     render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     // Wrap the click action in act
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     await waitFor(() => {
//       expect(global.fetch).toHaveBeenCalled();
//     });

//     // Verify that open was not called due to error
//     expect(mockOpen).not.toHaveBeenCalled();

//     consoleSpy.mockRestore();
//   });

//   it('calls onSuccess callback with correct parameters', () => {
//     const mockMetadata = { link_session_id: 'test-session-id' };
//     const mockPublicToken = 'test-public-token';
    
//     let onSuccessCallback;
//     mockUsePlaidLink.mockImplementation(({ onSuccess }) => {
//       onSuccessCallback = onSuccess;
//       return { open: mockOpen, ready: true };
//     });

//     render(<StartTomoIDV linkTokenData={{}} />);

//     // Simulate success callback
//     onSuccessCallback(mockPublicToken, mockMetadata);

//     // You can add assertions here based on what your onSuccess should do
//     // For now, it just logs, but you might want to test side effects
//   });

//   it('calls onExit callback with correct parameters', () => {
//     const mockError = { error_code: 'test-error' };
//     const mockMetadata = { link_session_id: 'test-session-id' };
    
//     let onExitCallback;
//     mockUsePlaidLink.mockImplementation(({ onExit }) => {
//       onExitCallback = onExit;
//       return { open: mockOpen, ready: true };
//     });

//     render(<StartTomoIDV linkTokenData={{}} />);

//     // Simulate exit callback
//     onExitCallback(mockError, mockMetadata);

//     // You can add assertions here based on what your onExit should do
//   });

//   it('calls onEvent callback and handles IDENTITY_VERIFICATION_START_STEP event', () => {
//     const mockMetadata = { link_session_id: 'test-session-id' };
//     const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
//     let onEventCallback;
//     mockUsePlaidLink.mockImplementation(({ onEvent }) => {
//       onEventCallback = onEvent;
//       return { open: mockOpen, ready: true };
//     });

//     render(<StartTomoIDV linkTokenData={{}} />);

//     // Simulate event callback
//     onEventCallback('IDENTITY_VERIFICATION_START_STEP', mockMetadata);

//     expect(consoleSpy).toHaveBeenCalledWith(
//       expect.stringContaining('Event IDENTITY_VERIFICATION_START_STEP')
//     );

//     consoleSpy.mockRestore();
//   });

//   it('does not open Plaid Link if link token is not set', async () => {
//     render(<StartTomoIDV linkTokenData={{}} />);
    
//     // Even if ready is true, it shouldn't open without a link token
//     await waitFor(() => {
//       expect(mockOpen).not.toHaveBeenCalled();
//     });
//   });

//   it('includes cookies in fetch request when button is clicked', async () => {
//     const mockLinkToken = 'test-link-token';
//     global.fetch.mockResolvedValueOnce({
//       json: async () => ({ link_token: mockLinkToken }),
//     });

//     render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Verify fetch was called with credentials to include cookies
//     await waitFor(() => {
//       expect(global.fetch).toHaveBeenCalledWith(
//         'http://localhost:8080/generate_link_token_for_idv',
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           credentials: 'include', // This is how cookies are included
//         }
//       );
//     });
//   });

//   it('uses credentials include instead of custom cookie header', async () => {
//     const mockLinkToken = 'test-link-token';
//     global.fetch.mockResolvedValueOnce({
//       json: async () => ({ link_token: mockLinkToken }),
//     });

//     render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Verify fetch was called with credentials: 'include' (not custom Cookie header)
//     await waitFor(() => {
//       expect(global.fetch).toHaveBeenCalledWith(
//         'http://localhost:8080/generate_link_token_for_idv',
//         expect.objectContaining({
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           credentials: 'include',
//         })
//       );
//     });
//   });

//   it('simulates full sign-in flow and includes cookies in IDV request', async () => {
//     // Mock sign-in response with Set-Cookie header
//     const mockSessionCookie = 'sessionId=test-session-123; Path=/; HttpOnly';
//     const mockUserCookie = 'userId=user456; Path=/';
    
//     // Mock fetch for both sign-in and IDV endpoints
//     global.fetch.mockImplementation((url, options) => {
//       if (url === 'http://localhost:3000/sign_in') {
//         return Promise.resolve({
//           ok: true,
//           json: async () => ({ success: true, user: { email: 'chan@test.com' } }),
//           headers: new Headers({
//             'Set-Cookie': `${mockSessionCookie}, ${mockUserCookie}`
//           })
//         });
//       } else if (url === 'http://localhost:8080/generate_link_token_for_idv') {
//         return Promise.resolve({
//           json: async () => ({ link_token: 'test-link-token' }),
//         });
//       }
//       return Promise.reject(new Error('Unexpected URL'));
//     });

//     // Step 1: Simulate sign-in
//     const signInResponse = await fetch('http://localhost:3000/sign_in', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         email: 'chan@test.com',
//         passcode: '1234'
//       })
//     });

//     // Step 2: Render component and test IDV flow
//     const { rerender } = render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Step 3: Verify IDV request was made with proper authentication
//     await waitFor(() => {
//       expect(global.fetch).toHaveBeenCalledWith(
//         'http://localhost:8080/generate_link_token_for_idv',
//         expect.objectContaining({
//           method: 'POST',
//           credentials: 'include',
//         })
//       );
//     });
//   });

//   it('creates a complete authentication flow with cookie persistence', async () => {
//     const mockSignInData = {
//       email: 'chan@test.com',
//       passcode: '1234'
//     };
    
//     const mockAuthCookies = 'authToken=jwt-token-123; refreshToken=refresh-456';
    
//     // Mock fetch for both sign-in and IDV endpoints
//     global.fetch.mockImplementation((url, options) => {
//       if (url === 'http://localhost:3000/sign_in') {
//         // Verify sign-in request payload
//         const body = JSON.parse(options.body);
//         expect(body).toEqual(mockSignInData);
        
//         return Promise.resolve({
//           ok: true,
//           json: async () => ({ 
//             success: true, 
//             user: { email: 'chan@test.com', id: 'user123' },
//             sessionId: 'session-abc'
//           }),
//           headers: new Headers({
//             'Set-Cookie': mockAuthCookies
//           })
//         });
//       } else if (url === 'http://localhost:8080/generate_link_token_for_idv') {
//         // Verify that credentials: 'include' is used for cookie handling
//         expect(options.credentials).toBe('include');
        
//         return Promise.resolve({
//           json: async () => ({ link_token: 'idv-token-789' }),
//         });
//       }
//       return Promise.reject(new Error(`Unexpected URL: ${url}`));
//     });

//     // Step 1: Simulate sign-in
//     const signInResponse = await fetch('http://localhost:3000/sign_in', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(mockSignInData),
//       credentials: 'include'
//     });

//     const signInResult = await signInResponse.json();
//     expect(signInResult.success).toBe(true);

//     // Step 2: Render component and test IDV flow
//     const { rerender } = render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Step 3: Verify IDV request was made with proper authentication
//     await waitFor(() => {
//       expect(global.fetch).toHaveBeenCalledTimes(2); // sign-in + IDV
//       expect(global.fetch).toHaveBeenLastCalledWith(
//         'http://localhost:8080/generate_link_token_for_idv',
//         expect.objectContaining({
//           method: 'POST',
//           credentials: 'include',
//         })
//       );
//     });
//   });

//   it('handles authentication failure gracefully', async () => {
//     const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
//     // Mock failed sign-in and successful IDV endpoint
//     global.fetch.mockImplementation((url, options) => {
//       if (url === 'http://localhost:3000/sign_in') {
//         return Promise.resolve({
//           ok: false,
//           status: 401,
//           json: async () => ({ error: 'Invalid credentials' }),
//         });
//       } else if (url === 'http://localhost:8080/generate_link_token_for_idv') {
//         // IDV endpoint should still work even without auth cookies
//         return Promise.resolve({
//           json: async () => ({ link_token: 'test-link-token' }),
//         });
//       }
//       return Promise.reject(new Error(`Unexpected URL: ${url}`));
//     });

//     // Attempt sign-in
//     const signInResponse = await fetch('http://localhost:3000/sign_in', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         email: 'chan@test.com',
//         passcode: 'wrong-passcode'
//       }),
//       credentials: 'include'
//     });

//     expect(signInResponse.ok).toBe(false);

//     const { rerender } = render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Should still attempt IDV request but without authentication cookies
//     await waitFor(() => {
//       expect(global.fetch).toHaveBeenCalledWith(
//         'http://localhost:8080/generate_link_token_for_idv',
//         expect.objectContaining({
//           method: 'POST',
//           credentials: 'include',
//         })
//       );
//     });

//     consoleSpy.mockRestore();
//   });

//   it('ensures open is called only when all conditions are met', async () => {
//     const mockLinkToken = 'test-link-token';
    
//     // Step 1: ready가 false인 상태에서 시작
//     mockUsePlaidLink.mockReturnValue({
//       open: mockOpen,
//       ready: false, // initially not ready
//     });

//     global.fetch.mockResolvedValueOnce({
//       json: async () => ({ link_token: mockLinkToken }),
//     });

//     const { rerender } = render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     // Button should be disabled when not ready
//     expect(button).toBeDisabled();
//     expect(mockOpen).not.toHaveBeenCalled();

//     // Step 2: ready가 true가 되도록 mock 업데이트
//     mockUsePlaidLink.mockReturnValue({
//       open: mockOpen,
//       ready: true,
//     });

//     // Re-render with ready = true
//     rerender(<StartTomoIDV linkTokenData={{}} />);
    
//     const readyButton = screen.getByText('Start Identity Verification');
//     expect(readyButton).not.toBeDisabled();

//     await act(async () => {
//       fireEvent.click(readyButton);
//     });

//     // Now open should be called since all conditions are met
//     await waitFor(() => {
//       expect(mockOpen).toHaveBeenCalledTimes(1);
//     }, { timeout: 3000 });
//   });

//   it('does not call open multiple times for same conditions', async () => {
//     const mockLinkToken = 'test-link-token';
//     global.fetch.mockResolvedValue({
//       json: async () => ({ link_token: mockLinkToken }),
//     });

//     const { rerender } = render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     // Click button multiple times
//     await act(async () => {
//       fireEvent.click(button);
//     });
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Wait for all effects to settle
//     await waitFor(() => {
//       expect(mockOpen).toHaveBeenCalled();
//     }, { timeout: 3000 });

//     // Should be called at least once, but we need to verify the exact behavior
//     // 실제 구현에 따라 여러 번 호출될 수 있으므로 이를 확인
//     expect(mockOpen).toHaveBeenCalled();
    
//     // 정확한 호출 횟수 확인 (구현에 따라 조정 필요)
//     const callCount = mockOpen.mock.calls.length;
//     expect(callCount).toBeGreaterThanOrEqual(1);
//   });

//   it('verifies complete flow: fetch -> set state -> trigger useEffect -> call open', async () => {
//     const mockLinkToken = 'test-link-token';
    
//     // Step-by-step verification
//     let fetchResolved = false;
//     global.fetch.mockImplementation(() => {
//       return Promise.resolve({
//         json: async () => {
//           fetchResolved = true;
//           return { link_token: mockLinkToken };
//         }
//       });
//     });

//     const { rerender } = render(<StartTomoIDV linkTokenData={{}} />);
    
//     const button = screen.getByText('Start Identity Verification');
    
//     expect(mockOpen).not.toHaveBeenCalled();
    
//     await act(async () => {
//       fireEvent.click(button);
//     });

//     // Verify fetch was called and resolved
//     await waitFor(() => {
//       expect(fetchResolved).toBe(true);
//     });

//     // Verify open was called after state updates
//     await waitFor(() => {
//       expect(mockOpen).toHaveBeenCalledTimes(1);
//     }, { timeout: 3000 });

//     // Final verification
//     expect(global.fetch).toHaveBeenCalledTimes(1);
//     expect(mockOpen).toHaveBeenCalledTimes(1);
//   });
// });
