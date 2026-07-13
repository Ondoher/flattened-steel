#include <OpenEXR/ImfChannelList.h>
#include <OpenEXR/ImfFrameBuffer.h>
#include <OpenEXR/ImfHeader.h>
#include <OpenEXR/ImfInputFile.h>
#include <OpenEXR/ImfOutputFile.h>

#include <cstddef>
#include <cstdint>
#include <fstream>
#include <filesystem>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

struct Pixel {
  float r;
  float g;
  float b;
  float a;
};

int parseDimension(const char* text, const char* label) {
  const std::string value(text);
  std::size_t consumed = 0;
  const long long parsed = std::stoll(value, &consumed, 10);
  if (consumed != value.size() || parsed < 1 ||
      parsed > std::numeric_limits<int>::max()) {
    throw std::runtime_error(std::string(label) + " is invalid");
  }
  return static_cast<int>(parsed);
}

std::vector<Pixel> readRaw(const std::string& path, int width, int height) {
  const std::uintmax_t count = static_cast<std::uintmax_t>(width) * height;
  if (count > std::numeric_limits<std::size_t>::max() / sizeof(Pixel)) {
    throw std::runtime_error("raw image dimensions overflow");
  }
  std::vector<Pixel> pixels(static_cast<std::size_t>(count));
  std::ifstream stream(path, std::ios::binary | std::ios::ate);
  if (!stream) throw std::runtime_error("cannot open raw input");
  const auto size = stream.tellg();
  const auto expected = static_cast<std::streamoff>(pixels.size() * sizeof(Pixel));
  if (size != expected) throw std::runtime_error("raw input byte count is invalid");
  stream.seekg(0);
  stream.read(reinterpret_cast<char*>(pixels.data()), expected);
  if (!stream) throw std::runtime_error("cannot read complete raw input");
  return pixels;
}

void writeRaw(const std::string& path, const std::vector<Pixel>& pixels) {
  if (std::filesystem::exists(path)) {
    throw std::runtime_error("raw output already exists");
  }
  std::ofstream stream(path, std::ios::binary);
  if (!stream) throw std::runtime_error("cannot open raw output");
  stream.write(reinterpret_cast<const char*>(pixels.data()),
               static_cast<std::streamsize>(pixels.size() * sizeof(Pixel)));
  if (!stream) throw std::runtime_error("cannot write complete raw output");
}

OPENEXR_IMF_NAMESPACE::FrameBuffer frameBuffer(std::vector<Pixel>& pixels,
                                                int width) {
  using OPENEXR_IMF_NAMESPACE::FLOAT;
  using OPENEXR_IMF_NAMESPACE::FrameBuffer;
  using OPENEXR_IMF_NAMESPACE::Slice;
  FrameBuffer result;
  char* base = reinterpret_cast<char*>(pixels.data());
  const std::size_t xStride = sizeof(Pixel);
  const std::size_t yStride = sizeof(Pixel) * static_cast<std::size_t>(width);
  result.insert("R", Slice(FLOAT, base + offsetof(Pixel, r), xStride, yStride));
  result.insert("G", Slice(FLOAT, base + offsetof(Pixel, g), xStride, yStride));
  result.insert("B", Slice(FLOAT, base + offsetof(Pixel, b), xStride, yStride));
  result.insert("A", Slice(FLOAT, base + offsetof(Pixel, a), xStride, yStride,
                           1, 1, 1.0));
  return result;
}

void writeExr(const std::string& rawPath, int width, int height,
              const std::string& exrPath) {
  using OPENEXR_IMF_NAMESPACE::Channel;
  using OPENEXR_IMF_NAMESPACE::FLOAT;
  using OPENEXR_IMF_NAMESPACE::Header;
  using OPENEXR_IMF_NAMESPACE::OutputFile;
  if (std::filesystem::exists(exrPath)) {
    throw std::runtime_error("EXR output already exists");
  }
  auto pixels = readRaw(rawPath, width, height);
  Header header(width, height);
  header.channels().insert("R", Channel(FLOAT));
  header.channels().insert("G", Channel(FLOAT));
  header.channels().insert("B", Channel(FLOAT));
  header.channels().insert("A", Channel(FLOAT));
  OutputFile output(exrPath.c_str(), header);
  auto buffer = frameBuffer(pixels, width);
  output.setFrameBuffer(buffer);
  output.writePixels(height);
}

void readExr(const std::string& exrPath, const std::string& rawPath) {
  using OPENEXR_IMF_NAMESPACE::InputFile;
  InputFile input(exrPath.c_str());
  const auto window = input.header().dataWindow();
  if (window.min.x != 0 || window.min.y != 0) {
    throw std::runtime_error("EXR data window must begin at zero");
  }
  const int width = window.max.x + 1;
  const int height = window.max.y + 1;
  if (width < 1 || height < 1) throw std::runtime_error("EXR dimensions are invalid");
  std::vector<Pixel> pixels(static_cast<std::size_t>(width) * height);
  for (auto& pixel : pixels) pixel.a = 1.0f;
  auto buffer = frameBuffer(pixels, width);
  input.setFrameBuffer(buffer);
  input.readPixels(0, height - 1);
  writeRaw(rawPath, pixels);
}

}  // namespace

int main(int argc, char** argv) {
  try {
    if (argc == 6 && std::string(argv[1]) == "write") {
      writeExr(argv[2], parseDimension(argv[3], "width"),
               parseDimension(argv[4], "height"), argv[5]);
      return 0;
    }
    if (argc == 4 && std::string(argv[1]) == "read") {
      readExr(argv[2], argv[3]);
      return 0;
    }
    std::cerr << "usage: exr-rgba-f32 write <rgba.raw> <width> <height> <out.exr>\n"
                 "       exr-rgba-f32 read <in.exr> <rgba.raw>\n";
    return 2;
  } catch (const std::exception& error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
