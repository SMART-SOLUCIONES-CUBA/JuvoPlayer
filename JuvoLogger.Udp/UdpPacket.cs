﻿/*!
 * https://github.com/SamsungDForum/JuvoPlayer
 * Copyright 2020, Samsung Electronics Co., Ltd
 * Licensed under the MIT license
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

using System;
using System.Net.Sockets;
using System.Text;

namespace JuvoLogger.Udp
{
    internal class UdpPacket : IDisposable
    {
        public delegate void AsyncDone(object o, SocketAsyncEventArgs args);
        public delegate void PacketDone(UdpPacket packet);

        private readonly AsyncDone _completeAsyncHandler;
        private readonly PacketDone _completedPacketHandler;
        private readonly SocketAsyncEventArgs _asyncState;

        public UdpPacket(in int bufferCapacity, in AsyncDone asyncHandler, in PacketDone packetHandler = null)
        {
            _completeAsyncHandler = asyncHandler;
            _completedPacketHandler = packetHandler;
            _asyncState = CreateSocketAsyncEventArgs();
            _asyncState.SetBuffer(new byte[bufferCapacity], 0, 0); // Mark buffer as "empty"
        }

        public UdpPacket(in byte[] message, in AsyncDone asyncHandler, in PacketDone packetHandler = null)
        {
            _completeAsyncHandler = asyncHandler;
            _completedPacketHandler = packetHandler;
            _asyncState = CreateSocketAsyncEventArgs();
            _asyncState.SetBuffer(message, 0, message.Length); // Mark buffer as "containing data"
        }

        private SocketAsyncEventArgs CreateSocketAsyncEventArgs()
        {
            SocketAsyncEventArgs asyncState = new SocketAsyncEventArgs
            {
                UserToken = this
            };
            asyncState.Completed += new EventHandler<SocketAsyncEventArgs>(_completeAsyncHandler);
            return asyncState;
        }

        public int Append(in string message, int startIndex, int count)
        {
            var buffer = _asyncState.Buffer;
            var bufferedBytes = _asyncState.Count;

            // Truncate input message to available buffer space.
            var consumeLength = Math.Min(count, buffer.Length - bufferedBytes);

            Encoding.UTF8.GetBytes(message, startIndex, consumeLength, buffer, bufferedBytes);
            _asyncState.SetBuffer(_asyncState.Offset, bufferedBytes + consumeLength);
            return consumeLength;
        }

        public static void Complete(in UdpPacket packet) => packet._completedPacketHandler?.Invoke(packet);

        public static void CompleteAsync(in UdpPacket packet) => packet._completeAsyncHandler(null, packet._asyncState);

        public void Dispose()
        {
            _asyncState.Dispose();
        }

        public static implicit operator SocketAsyncEventArgs(in UdpPacket packet) => packet._asyncState;
        public static implicit operator UdpPacket(in SocketAsyncEventArgs asyncState) => (UdpPacket)asyncState.UserToken;
    }
}
