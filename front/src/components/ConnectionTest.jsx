import { useState, useEffect } from 'react';
import axios from 'axios';

function ConnectionTest() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Đang kiểm tra kết nối...');

  useEffect(() => {
    axios.get('http://localhost:8080/api/health')
      .then(() => {
        setStatus('success');
        setMessage('Kết nối thành công đến backend!');
      })
      .catch((error) => {
        setStatus('error');
        setMessage('Không thể kết nối đến backend: ' + error.message);
      });
  }, []);

  return (
    <div className={`status-indicator status-${status}`}>
      {message}
    </div>
  );
}

export default ConnectionTest;
