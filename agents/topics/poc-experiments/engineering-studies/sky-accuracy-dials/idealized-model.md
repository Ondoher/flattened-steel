# Algorithm Idealization: Continuous Mathematical Target

## Overview

The idealized algorithm defines a continuous field of scattered light, then
integrates that field exactly along the viewing ray. There is no grid,
interpolation, sample count or scattering-order cutoff.

Its structure is:

1. Describe the atmosphere's density, scattering and absorption continuously.
2. Define exact attenuation along every unobstructed light path.
3. Define the local scattering source from direct sunlight and light arriving
   from every surrounding direction, including ground reflection.
4. Require that source and the transported radiance field to satisfy their
   coupled equations simultaneously everywhere.
5. Obtain the observer's radiance from the exact attenuated viewing integral
   and boundary contribution.

The continuous source function is the ideal counterpart of the current cache.
Cache storage, interpolation and ray samples are subsequent approximations to
this target. The sections below define the equations and their assumptions.

## Purpose And Scope

The owner selected formulation of the idealized algorithm before further
factor-isolation experiments. This document defines a proposed continuous
target for the existing atmospheric algorithm. It removes discretization,
interpolation, finite scattering-order truncation and machine arithmetic. It
retains explicit physical assumptions so that an exact solution of this model
is not mistaken for an exact description of the Kider sky.

The current control supplies a stationary, spherical, radially stratified
atmosphere; a distant collimated Sun; elastic, unpolarized Rayleigh and aerosol
scattering; aerosol absorption; straight light paths; and a spatially uniform
Lambertian ground. There is no atmospheric emission or incoming diffuse light
from space. Clouds, horizontal atmospheric variation, refraction, polarization,
a finite solar disk and additional absorbers would be changes to the physical
model, not removal of discretization error.

The local [physical coefficient and phase owner](../../../../../experiments/sky-accuracy-dials/numerics/direct.js)
and [ground recurrence](../../../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js)
are the implementation anchors. The continuous equations below are a
mathematical synthesis, not a claim that every existing implementation path
already evaluates them correctly. Bruneton's
[documented formulation](https://ebruneton.github.io/precomputed_atmospheric_scattering/atmosphere/functions.glsl.html)
provides a primary cross-check for attenuation, scattering and ground transport.

## 1. Unknown And Direction Convention

Work at one wavelength, suppressing its subscript when convenient. The unknown
is spectral radiance L(x,v): light arriving at position x **from** unit direction
v, traveling toward x along -v. It excludes the unscattered solar beam, which
we account for explicitly. Units are W m^-2 sr^-1 nm^-1.

Let s point toward the distant Sun. The atmosphere occupies
R_g < |x| < R_t, with height h(x)=|x|-R_g. A viewing path is x(t)=x+t v,
ending at its first ground or outer-atmosphere boundary, distance d. All dot
products below use this same direction convention.

## 2. Exact Medium And Scattering Kernel

For the current exponential atmosphere:

$$
\beta_R(h,\lambda)=b_R(\lambda)e^{-h/H_R},\qquad
\beta_{M,e}(h,\lambda)=b_M(\lambda)e^{-h/H_M}.
$$

With aerosol single-scattering albedo 0 <= w_M <= 1:

$$
\beta_{M,s}=w_M\beta_{M,e},\qquad
\beta_e=\beta_R+\beta_{M,e},\qquad
\beta_a=(1-w_M)\beta_{M,e}.
$$

The spectral coefficients b_R and b_M are physical input functions. Retained
channel values constrain them at the existing wavelengths; they do not uniquely
specify a continuous spectrum between those wavelengths.

For c=v dot u and |g|<1, retain the current analytic phase laws:

$$
p_R(c)=\frac{3}{16\pi}(1+c^2),\qquad
p_M(c)=\frac{3}{8\pi}\frac{1-g^2}{2+g^2}
\frac{1+c^2}{(1+g^2-2gc)^{3/2}}.
$$

Each integrates to one over outgoing solid angle. Define

$$
K_\lambda(x;v,u)=\beta_R(x,\lambda)p_R(v\cdot u)
+\beta_{M,s}(x,\lambda)p_M(v\cdot u).
$$

K describes scattering from light arriving from u into light traveling along
-v. Both propagation directions are negated, so their scattering cosine is
v dot u. K has units m^-1 sr^-1. Extinction includes aerosol absorption;
the scattering kernel does not.

## 3. Exact Attenuation And Direct Sunlight

For a segment within the atmosphere:

$$
T_\lambda(x,x+t v)=
\exp\left[-\int_0^t\beta_e(x+qv,\lambda)\,dq\right].
$$

Let V_s(x) be one if the ray toward the Sun reaches space without crossing
ground, otherwise zero. With d_s the distance to the top along s:

$$
T_s(x)=V_s(x)\exp\left[-\int_0^{d_s}\beta_e(x+qs)\,dq\right].
$$

If E_s(lambda) is extraterrestrial solar spectral irradiance on a plane
perpendicular to the beam, the direct-solar scattering source is

$$
J_\odot(x,v)=E_s T_s(x)K(x;v,s).
$$

There is no additional zenith cosine in this volume-scattering expression.
A cosine enters when converting the beam into irradiance on a surface.

## 4. Self-Consistent Local Source And Viewing Integral

The complete local source, with radiance-per-length units, is

$$
\boxed{J(x,v)=J_\odot(x,v)+
\int_{\mathbb S^2}K(x;v,u)L(x,u)\,d\Omega_u.}
$$

The light arriving along any viewing ray is

$$
\boxed{L(x,v)=T(x,x+d v)L_b(x+d v,v)
+\int_0^d T(x,x+t v)J(x+t v,v)\,dt.}
$$

These equations hold simultaneously at every point and direction. The angular
integral supplies light scattered from the entire surrounding field; the path
integral transports that local contribution to the observer. Their dependence
on each other is multiple scattering, not a need to choose a finite number of
computational passes in the mathematical definition.

At the top boundary, L_b=0 for the diffuse field. The direct Sun is excluded
from L and supplied by J_sun, so it must not be added a second time to the
angular scattering integral. An observable that includes the direct solar beam
must add its separately defined contribution.

## 5. Exact Ground Boundary

At a ground point y, with outward normal n and spectral albedo a(lambda), the
radiance reflected into the atmosphere is independent of outgoing direction:

$$
L_g(y)=\frac{a}{\pi}\left[
E_s T_s(y)\max(0,n\cdot s)
+\int_{n\cdot u>0}L(y,u)(n\cdot u)\,d\Omega_u
\right].
$$

For a viewing ray ending on ground, L_b=L_g. This includes direct illumination,
diffuse illumination and repeated atmosphere-ground exchange through the same
coupled equations. The incident diffuse field is evaluated from the atmospheric
side of the boundary. A black-ground control is simply a=0.

## 6. Idealized Form Of The Algorithm

Given the physical inputs and Sun direction, define the exact continuous source
field J solving the coupled equations. For an observer and viewing direction,
evaluate the exact attenuated path integral of that field plus its boundary
term. The ideal counterpart of the current source cache is therefore a
continuous function, not a texture or a collection of grid nodes.

Under spherical density, uniform ground and one collimated source, rotational
symmetry permits the parameterization

$$
J=F_\lambda(r,\mu,\mu_s,\nu),\qquad
\mu=\hat x\cdot v,\quad \mu_s=\hat x\cdot s,\quad \nu=v\cdot s.
$$

The four geometric arguments describe height, viewing zenith, solar zenith and
view-to-Sun angle on their physically realizable domain. This is an exact
symmetry reduction under those assumptions; discretizing F introduces a
separate approximation. Along a straight ray, nu stays constant while radius
and the local zenith cosines change continuously.

Equivalently, let L_seed include transported direct-solar scattering and direct
solar ground reflection, and let A transport one further atmospheric scattering
or diffuse ground reflection. Then

$$
L=L_{\rm seed}+\mathcal A L.
$$

Where the passive transport problem admits the convergent expansion:

$$
L=\sum_{n=0}^{\infty}\mathcal A^n L_{\rm seed}.
$$

This groups paths by added interactions; it is not a redefinition of the
implementation's existing N1/N2 ground-order bookkeeping. Every term is
nonnegative for physical nonnegative inputs. A finite cutoff omits positive
contributions; it cannot lower an existing excess through a negative later
order. Exact formulation does not imply an elementary closed-form solution.

## 7. Mathematical Checks And Observation Boundary

The target has useful identities independent of Kider measurements:

- T(x,z)=T(x,y)T(y,z) along an unobstructed ordered segment; 0<T<=1 for finite
  nonnegative optical depth.
- The phase functions are normalized and nonnegative; absorption removes
  energy rather than redistributing it into the scattering source.
- L and J are nonnegative for physical inputs. Scaling E_s by a positive factor
  scales the entire solution by that factor when medium and albedo are fixed.
- With zero atmospheric scattering and black ground, diffuse L is zero.
- Rotations preserving the spherical medium and relative geometry preserve
  the solution. This symmetry need not hold in the actual measured atmosphere.

The measured quantity is a separate observation operator M[L], incorporating
known pointing, spectral response, aperture and acquisition-time averaging as
applicable. An ideal point/direction/wavelength measurement reduces to evaluating
L at that point, direction and wavelength. Kider comparison asks whether M[L]
matches observations; solver correctness asks whether the implementation
approximates the coupled equations above. Neither question answers the other.

Kider measurements are the empirical correctness target. A converged solution
of these equations is the numerical reference, whose physical assumptions
still need to explain those measurements. The
[direct convergence report](direct-convergence-results.md) owns the completed
cache-free stochastic evaluation, uncertainty and remaining Kider residuals.

This formulation starts no execution and selects no replacement geometry or
physical coefficients. The owner's adoption hold remains. Loop-free O(1) work
per runtime sample remains an implementation constraint for a later
approximation; it does not replace either continuous integral in this target.
