// Thin, non-rendering adapter for the externally published Bruneton
// clear-sky-models source. This file does not copy a production Algorithm32
// implementation; it only asks the pinned external models for the B1 boundary
// observable and writes the values consumed by the independent JS scorer.

#include <cmath>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include "atmosphere/atmosphere.h"
#include "atmosphere/hemispherical_function.h"
#include "atmosphere/measurement/measured_atmosphere.h"
#include "atmosphere/model/bruneton/bruneton.h"
#include "atmosphere/model/haber/haber.h"
#include "atmosphere/model/hosek/hosek.h"
#include "atmosphere/model/libradtran/libradtran.h"
#include "atmosphere/model/nishita/nishita93.h"
#include "atmosphere/model/nishita/nishita96.h"
#include "atmosphere/model/oneal/oneal.h"
#include "atmosphere/model/preetham/preetham.h"
#include "atmosphere/sun_direction.h"

namespace {

std::string TwoDigits(int value) {
  std::ostringstream out;
  if (value < 10) out << '0';
  out << value;
  return out.str();
}

struct Condition {
  std::string time;
  std::unique_ptr<MeasuredAtmosphere> measurement;
};

std::vector<Condition> LoadMeasurements(const std::string& root) {
  Location location;
  location.latitude = 42.44337;
  location.longitude = -76.48163;
  Time utc;
  utc.year = 2013;
  utc.month = 5;
  utc.day = 27;
  utc.seconds = 0;

  std::vector<Condition> result;
  for (int i = 0; i < 17; ++i) {
    const int local_minutes = 9 * 60 + 30 + i * 15;
    const int local_hour = local_minutes / 60;
    const int minute = local_minutes % 60;
    utc.hours = local_hour + 4;
    utc.minutes = minute;
    SunCoordinates sun;
    GetSunDirection(utc, location, &sun);
    Condition condition;
    condition.time = TwoDigits(local_hour) + ":" + TwoDigits(minute);
    condition.measurement.reset(new MeasuredAtmosphere(
        root, "2013-05-27", TwoDigits(local_hour), TwoDigits(minute),
        sun.zenith * deg, sun.azimuth * deg, ""));
    result.push_back(std::move(condition));
  }
  return result;
}

void WriteHeader(std::ofstream* output) {
  *output << "model\ttime\tgrid_x\tgrid_y";
  for (int i = 0; i < 40; ++i) *output << "\tlambda_" << i;
  *output << '\n';
}

void EmitModel(const std::string& name, const Atmosphere& model,
    const std::vector<Condition>& conditions, std::ofstream* output) {
  double total_time_rmse_squared = 0.0;
  for (const Condition& condition : conditions) {
    double error_squared = 0.0;
    int count = 0;
    const MeasuredAtmosphere& measurement = *condition.measurement;
    for (int x = 0; x < 9; ++x) {
      for (int y = 0; y < 9; ++y) {
        Angle view_zenith;
        Angle view_azimuth;
        HemisphericalFunction<Number>::GetSampleDirection(
            x, y, &view_zenith, &view_azimuth);
        const RadianceSpectrum spectrum = model.GetSkyRadiance(
            0.0 * m, measurement.sun_zenith(), measurement.sun_azimuth(),
            view_zenith, view_azimuth);
        const RadianceSpectrum measured = measurement.GetSkyRadianceMeasurement(
            0.0 * m, measurement.sun_zenith(), measurement.sun_azimuth(),
            view_zenith, view_azimuth);
        *output << name << '\t' << condition.time << '\t' << x << '\t' << y;
        for (unsigned int k = 0; k < spectrum.size(); ++k) {
          *output << '\t' << std::setprecision(17)
                  << spectrum[k].to(watt_per_square_meter_per_sr_per_nm);
          if (spectrum.GetSample(k) >= 360.0 * nm &&
              spectrum.GetSample(k) <= 720.0 * nm) {
            const SpectralRadiance residual = spectrum[k] - measured[k];
            const double value = residual.to(watt_per_square_meter_per_sr_per_nm);
            error_squared += value * value;
            ++count;
          }
        }
        *output << '\n';
      }
    }
    const double time_rmse_w = std::sqrt(error_squared / count);
    total_time_rmse_squared += time_rmse_w * time_rmse_w;
    std::cerr << "B1 " << name << ' ' << condition.time << " RMSE = "
              << std::setprecision(10) << time_rmse_w * 1000.0
              << " mW m^-2 sr^-1 nm^-1 (" << count << " samples)\n";
  }
  std::cerr << "B1 " << name << " aggregate RMSE = "
            << std::setprecision(10)
            << std::sqrt(total_time_rmse_squared / conditions.size()) * 1000.0
            << " mW m^-2 sr^-1 nm^-1\n";
}

}  // namespace

bool IsModelName(const std::string& name) {
  return name == "all" || name == "nishita93" || name == "nishita96" ||
      name == "preetham" || name == "oneal" || name == "haber" ||
      name == "bruneton" || name == "elek" || name == "hosek" ||
      name == "libradtran";
}

bool Selected(const std::string& selection, const std::string& model) {
  return selection == "all" || selection == model;
}

int main(int argc, char** argv) {
  if (argc < 3 || argc > 5) {
    std::cerr << "Usage: " << argv[0]
              << " <Kider extracted measurement root> <output.tsv>"
              << " [model|all] [libRadtran uvspec path]\n";
    return 2;
  }
  const std::string selection = argc >= 4 ? argv[3] : "all";
  if (!IsModelName(selection)) {
    std::cerr << "Unknown model selection: " << selection << '\n';
    return 2;
  }
  if (selection == "libradtran" && argc != 5) {
    std::cerr << "The libradtran selection requires a uvspec path.\n";
    return 2;
  }
  std::vector<Condition> conditions = LoadMeasurements(argv[1]);
  std::ofstream output(argv[2]);
  if (!output) {
    std::cerr << "Cannot open output table: " << argv[2] << '\n';
    return 2;
  }
  WriteHeader(&output);

  if (Selected(selection, "nishita93"))
    EmitModel("nishita93", Nishita93(), conditions, &output);
  if (Selected(selection, "nishita96"))
    EmitModel("nishita96", Nishita96(Nishita96::ALL_ORDERS), conditions, &output);
  if (Selected(selection, "preetham"))
    EmitModel("preetham", Preetham(Turbidity), conditions, &output);
  if (Selected(selection, "oneal"))
    EmitModel("oneal", ONeal(), conditions, &output);
  if (Selected(selection, "haber"))
    EmitModel("haber", Haber(Haber::ALL_ORDERS), conditions, &output);
  if (Selected(selection, "bruneton"))
    EmitModel("bruneton", Bruneton(Bruneton::ALL_ORDERS, 3), conditions, &output);
  if (Selected(selection, "elek"))
    EmitModel("elek", Bruneton(Bruneton::ALL_ORDERS, 15), conditions, &output);
  if (Selected(selection, "hosek"))
    EmitModel("hosek", Hosek(Turbidity), conditions, &output);
  if (Selected(selection, "libradtran") && argc == 5) {
    EmitModel("libradtran", LibRadtran(
        argv[4], LibRadtran::HEMISPHERICAL_FUNCTION_CACHE), conditions,
        &output);
  }
  return output.good() ? 0 : 1;
}
