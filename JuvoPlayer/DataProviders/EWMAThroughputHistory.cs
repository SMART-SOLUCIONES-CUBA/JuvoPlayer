/*!
 * https://github.com/SamsungDForum/JuvoPlayer
 * Copyright 2018, Samsung Electronics Co., Ltd
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
using static Configuration.EWMAThroughputHistory;

namespace JuvoPlayer.DataProviders
{
    public class EWMAThroughputHistory : IThroughputHistory
    {
        private double slowBandwidth = Config.SlowBandwidth;
        private double fastBandwidth = Config.FastBandwidth;

        private readonly object throughputLock = new object();

        public double GetAverageThroughput()
        {
            lock (throughputLock)
            {
                return Math.Min(slowBandwidth, fastBandwidth);
            }
        }

        public void Push(int sizeInBytes, TimeSpan duration)
        {
            lock (throughputLock)
            {
                var bw = 8.0 * sizeInBytes / duration.TotalSeconds;
                slowBandwidth = Config.SlowEWMACoeff * slowBandwidth + (1 - Config.SlowEWMACoeff) * bw;
                fastBandwidth = Config.FastEWMACoeff * fastBandwidth + (1 - Config.FastEWMACoeff) * bw;
            }
        }

        public void Reset()
        {
            lock (throughputLock)
            {
                slowBandwidth = Config.SlowBandwidth;
                fastBandwidth = Config.FastBandwidth;
            }
        }
    }
}